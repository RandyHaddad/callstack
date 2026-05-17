import { cfg } from "./config.ts";
import { AgentphoneEvent, CallSpec, CustomerContext, NotifyResult, RepairResult } from "./types.ts";
import { extractCallSpec, timestamp } from "./llm.ts";
import { appendInteractionToWorkOrder, buildIssueIdentity, findExistingWorkOrder, persistToGBrain, searchGBrain } from "./gbrain.ts";
import { runRepairLoop } from "./repair.ts";
import { sendFollowUp } from "./notify.ts";
import { randomUUID } from "node:crypto";
import { addTrace } from "./trace.ts";

const pickText = (event: AgentphoneEvent): string => {
  const nestedTranscript = event.data?.transcript;
  const transcriptText = Array.isArray(nestedTranscript)
    ? nestedTranscript.map((turn) => turn.content).filter(Boolean).join("\n")
    : nestedTranscript;

  return (
    transcriptText ||
    event.data?.message ||
    event.data?.summary ||
    event.transcript ||
    event.message ||
    event.body ||
    event.text ||
    event.raw_text ||
    "Customer shared an issue without transcript."
  );
};

const determineRepo = (rawRepo?: string): string => {
  if (rawRepo && rawRepo.includes("/")) {
    return rawRepo;
  }
  return cfg.repoFallback;
};

const normalizeCaller = (event: AgentphoneEvent): { phone: string; name: string; id?: string } => {
  const from = event.from || event.caller || { phone: "", name: "" };
  const phone = event.data?.from || from.phone || from.number || "unknown";
  const name = from.name || "Unknown Caller";
  return { phone: phone, name: name || "Unknown Caller", id: from.id };
};

const callerEmail = (event: AgentphoneEvent): string | undefined => {
  const metadataEmail = event.metadata?.email || event.metadata?.customer_email || event.metadata?.contact_email;
  if (typeof metadataEmail === "string" && metadataEmail.includes("@")) return metadataEmail;
  const dataEmail = (event.data as { email?: string } | undefined)?.email;
  if (typeof dataEmail === "string" && dataEmail.includes("@")) return dataEmail;
  return cfg.customerEmailFallback || undefined;
};

const inferChannel = (event: AgentphoneEvent): "voice" | "sms" | "text" => {
  if (event.channel === "sms" || event.channel === "mms" || event.kind === "sms" || event.event_type === "sms") return "sms";
  if (event.channel === "imessage" || event.kind === "message") return "text";
  return event.channel === "voice" ? "voice" : "voice";
};

const normalizePhone = (value?: string) => (value ?? "").replace(/\D/g, "").slice(-11);

const isAcmeFdeEvent = (event: AgentphoneEvent) => {
  const phones = [
    event.data?.from,
    event.data?.to,
    event.from?.phone,
    event.from?.number,
    event.caller?.phone,
    event.caller?.number,
    event.to?.phone,
    event.to?.number,
  ];
  return phones.some((phone) => ["14159660622", "4159660622", "14155550199", "4155550199"].includes(normalizePhone(phone))) ||
    event.data?.numberId === "cmp8vmi7u050nyf5rc5m5qzih" ||
    event.agentId === "cmp8vmaei050lyf5r83jgd9lb";
};

const inferCustomer = async (event: AgentphoneEvent, transcript: string, callerName: string): Promise<CustomerContext> => {
  const metadata = event.metadata ?? {};
  const text = `${transcript} ${callerName}`.toLowerCase();
  const maybeString = (key: string, fallback: string) => {
    const value = metadata[key];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
  };

  if (isAcmeFdeEvent(event) || text.includes("acme") || text.includes("sarah")) {
    const memoryHits = await searchGBrain(`Acme ${transcript}`, 3);
    return {
      customer_name: maybeString("customer_name", "Acme"),
      contact_name: maybeString("contact_name", callerName === "Unknown Caller" ? "Haris Jalal" : callerName),
      contact_role: maybeString("contact_role", "CTO"),
      plan: maybeString("plan", "Enterprise"),
      tenant: maybeString("tenant", "acme-demo"),
      promised_feature: maybeString("promised_feature", "Customer implementation commitments tracked in GBrain"),
      promised_on: maybeString("promised_on", "Most recent customer timeline"),
      business_context: maybeString(
        "business_context",
        memoryHits[0]
          ? `GBrain matched prior Acme context: ${memoryHits.join(" | ")}`
          : "Enterprise customer escalation on the dedicated Acme FDE line. Use GBrain memory plus the caller report to scope the work.",
      ),
      memory_hits: memoryHits,
    };
  }

  const memoryHits = await searchGBrain(`${callerName} ${transcript}`, 3);
  return {
    customer_name: maybeString("customer_name", "Unknown Customer"),
    contact_name: maybeString("contact_name", callerName),
    contact_role: maybeString("contact_role", "Customer contact"),
    plan: maybeString("plan", "Unknown"),
    tenant: maybeString("tenant", "unknown"),
    promised_feature: maybeString("promised_feature", "Not yet known"),
    promised_on: maybeString("promised_on", "Unknown"),
    business_context: maybeString(
      "business_context",
      memoryHits[0]
        ? `GBrain matched existing context: ${memoryHits.join(" | ")}`
        : "Customer contacted the deployed AI FDE with a product escalation.",
    ),
    memory_hits: memoryHits,
  };
};

const gbrainIntelligence = (spec: CallSpec) => {
  const hits = spec.customer.memory_hits ?? [];
  const hasCustomer = spec.customer.customer_name !== "Unknown Customer";
  const hasTenant = spec.customer.tenant.toLowerCase() !== "unknown";
  const hasPlan = spec.customer.plan.toLowerCase() !== "unknown";
  const confidence = Math.max(
    20,
    Math.min(
      100,
      20 +
        (hasCustomer ? 15 : 0) +
        (hasTenant ? 10 : 0) +
        (hasPlan ? 15 : 0) +
        (hits.length ? Math.min(45, hits.length * 15) : 0),
    ),
  );

  return {
    summary: `GBrain inferred a scoped escalation for ${spec.customer.customer_name} in ${spec.customer.tenant}.`,
    confidence_score: confidence,
    confidence_label: confidence >= 80 ? "high" : confidence >= 55 ? "medium" : "low",
    signals: [
      `Identity: ${spec.customer.contact_name} (${spec.customer.contact_role}), plan ${spec.customer.plan}`,
      hits.length ? `Memory anchors: ${hits.join(" | ")}` : "No previous memory anchors found",
      `Promise: ${spec.customer.promised_feature} (${spec.customer.promised_on})`,
    ],
  };
};

const duplicateRepairBlock = (issueSlug: string, reason?: string, confidence?: number) => ({
  status: "blocked" as const,
  mode: cfg.repairMode,
  changed_files: [],
  notes:
    confidence !== undefined
      ? `Duplicate escalation detected. Reusing existing work order ${issueSlug} (match confidence ${confidence}): ${reason}`
      : `Duplicate escalation detected. Reusing existing work order ${issueSlug} instead of creating a parallel GStack run.`,
});

export const normalizeEvent = async (raw: AgentphoneEvent): Promise<CallSpec> => {
  const event_id = raw.id || raw.event_type || randomUUID();
  const caller = normalizeCaller(raw);
  const text = pickText(raw);
  const channel = inferChannel(raw);
  const defaultRepo = determineRepo((raw as { repo?: string }).repo);
  const customer = await inferCustomer(raw, text, caller.name);

  const extracted = await extractCallSpec(text, defaultRepo);
  const repo = determineRepo(extracted.repo || defaultRepo);

  return {
    source: channel === "sms" || channel === "text" ? "agentphone_sms" : "agentphone_call",
    event_id,
    caller_phone: caller.phone,
    caller_name: caller.name,
    caller_id: caller.id,
    customer,
    repo,
    type: extracted.type,
    product_area: extracted.product_area,
    user_pain: extracted.user_pain,
    repro_steps: extracted.repro_steps,
    expected_behavior: extracted.expected_behavior,
    acceptance_criteria: extracted.acceptance_criteria,
    risk_level: extracted.risk_level,
    requires_human_approval: extracted.requires_human_approval || cfg.requireCallerApproval,
    gstack_flow: extracted.gstack_flow,
    raw_payload: raw as unknown as Record<string, unknown>,
    channel,
    created_at: timestamp(),
  };
};

const followUpMessage = (
  spec: CallSpec,
  persisted: ReturnType<typeof buildIssueIdentity>,
  repair: RepairResult,
  duplicateMatch?: { issue_slug: string; reason: string; confidence_score: number },
): string => {
  if (repair.mode && repair.notes.startsWith("Duplicate escalation detected.")) {
    if (duplicateMatch) {
      return `FieldStack: your ${spec.customer.customer_name} escalation was merged into ${duplicateMatch.issue_slug} (${duplicateMatch.confidence_score} / 100). ${duplicateMatch.reason}`;
    }
    return `FieldStack: got your ${spec.customer.customer_name} report. ${repair.notes}`;
  }

  if (repair.status === "queued" || repair.status === "running") {
    const delivery = cfg.outboundSmsEnabled
      ? "We’re investigating now and will text back after QA."
      : "We’re investigating now; the follow-up is retained in the FieldStack control plane because outbound SMS is not enabled.";
    return `FieldStack: thanks, we got your ${spec.customer.customer_name} report. I found the ${spec.customer.promised_feature} promise for the ${spec.customer.plan} account and opened ${persisted.issueSlug}. ${delivery}`;
  }

  if (repair.status === "success") {
    if (repair.mode === "gstack") {
      const run = repair.run_id ? ` GStack run: ${repair.run_id}.` : "";
      const proof = repair.qa_result ? ` QA: ${repair.qa_result}` : "";
      return `FieldStack: found it for ${spec.customer.customer_name}. GBrain captured the escalation, and GStack completed the ${spec.product_area} work order for: ${spec.user_pain}.${run}${proof} Reply APPROVE to deploy.`;
    }

    const files = repair.changed_files.length
      ? `Updated files: ${repair.changed_files.join(", ")}.`
      : `I prepared the ${spec.customer.customer_name} patch and started validation.`;
    const link = repair.preview_url ? ` Preview: ${repair.preview_url}` : "";
    return `Found it. GBrain captured ${spec.customer.customer_name}'s context, and FieldStack prepared the ${spec.product_area} work order. ${files}${link} Reply APPROVE to deploy.`;
  }

  return `FieldStack: thanks, we got your ${spec.customer.customer_name} report and opened ${persisted.issueSlug}. The FDE run is blocked right now: ${repair.notes}`;
};

export const processIncomingEvent = async (
  raw: AgentphoneEvent,
): Promise<{ work_order: string; customer: string; contact: string; repair: RepairResult; follow_up: string; notify?: NotifyResult }> => {
  console.log("[fieldstack] processIncomingEvent start", raw.id || raw.event_type || raw.kind);
  await addTrace({
    type: "call",
    title: "Inbound customer signal",
    detail: pickText(raw),
    status: "complete",
    data: {
      event: raw.event || raw.event_type || raw.kind,
      channel: raw.channel || raw.kind || "voice",
      from: raw.data?.from || raw.from?.phone || raw.caller?.phone,
      to: raw.data?.to || raw.to?.phone,
    },
  });

  const spec = await normalizeEvent(raw);
  const intelligence = gbrainIntelligence(spec);
  console.log("[fieldstack] normalized spec", spec.event_id, spec.customer.customer_name, spec.repo, spec.source);
  const identity = buildIssueIdentity(spec);
  const existingWorkOrder = await findExistingWorkOrder(
    spec.customer.customer_name,
    spec.product_area,
    spec.customer.plan,
    spec.customer.tenant,
    spec.customer.contact_name,
  );

  let persisted = {
    issueSlug: identity.issueSlug,
    callerSlug: identity.callerSlug,
    meetingSlug: identity.meetingSlug,
    customerSlug: identity.customerSlug,
    projectSlug: identity.projectSlug,
  };
  let duplicateAppendStatus: { appended: boolean; reason?: string } | undefined;

  if (existingWorkOrder) {
    duplicateAppendStatus = await appendInteractionToWorkOrder(spec, existingWorkOrder.issue_slug);
    await addTrace({
      type: "system",
      title: "Duplicate incident merged",
      detail: existingWorkOrder.reason,
      status: "complete",
      data: {
        match: existingWorkOrder,
        active_work_order: existingWorkOrder.issue_slug,
        duplicate_interaction_appended: duplicateAppendStatus,
      },
    });
    persisted.issueSlug = existingWorkOrder.issue_slug;
  } else {
    persisted = await persistToGBrain(spec);
    console.log("[fieldstack] persisted pages", persisted);
  }

  const activeIssueSlug = existingWorkOrder?.issue_slug || persisted.issueSlug;
  await addTrace({
    type: "gbrain",
    title: "GBrain memory written",
    detail:
      `${intelligence.summary} ${intelligence.signals.join(" | ")} (confidence ${intelligence.confidence_score} / ${intelligence.confidence_label})`,
    intelligence,
    status: "complete",
    data: {
      ...persisted,
      gbrain_signals: intelligence.signals,
      confidence: intelligence.confidence_score,
      duplicate_match: existingWorkOrder
        ? {
            active_issue_slug: existingWorkOrder.issue_slug,
            existing_issue_confidence: existingWorkOrder.confidence_score,
            reason: existingWorkOrder.reason,
          }
        : null,
    },
  });

  const repair = existingWorkOrder
    ? duplicateRepairBlock(existingWorkOrder.issue_slug, existingWorkOrder.reason, existingWorkOrder.confidence_score)
    : cfg.autoRepair
      ? await runRepairLoop(spec)
      : {
      status: "queued",
    mode: cfg.repairMode,
    changed_files: [],
    notes: "Auto repair is disabled. Enable CALLSTACK_AUTO_REPAIR=1 to start the GStack FDE run.",
  };
  console.log("[fieldstack] repair result", repair.status);
  await addTrace({
    type: "gstack",
    title: existingWorkOrder
      ? "Duplicate incident merged"
      : repair.mode === "gstack"
      ? "GStack FDE run complete"
      : "FDE run state",
    detail: repair.notes,
    status: repair.status === "success" ? "complete" : repair.status === "failed" ? "failed" : repair.status === "blocked" ? "blocked" : "pending",
    data: repair,
  });

  const follow_up = followUpMessage(spec, persisted, repair, existingWorkOrder ?? undefined);
  let notify: NotifyResult | undefined;

  if (cfg.autoNotify) {
    console.log("[fieldstack] sending follow_up", spec.caller_phone);
    notify = await sendFollowUp({
      to: spec.caller_phone,
      from: cfg.notifyFromName,
      text: follow_up,
      event_id: spec.event_id,
      customer: spec.customer.customer_name,
      email: callerEmail(raw),
    });
  }

  return {
    work_order: activeIssueSlug,
    customer: persisted.customerSlug,
    contact: persisted.callerSlug,
    repair,
    follow_up,
    notify,
  };
};
