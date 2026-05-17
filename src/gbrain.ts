import { cfg } from "./config.ts";
import { CallSpec, PageSpec } from "./types.ts";
import { runCommand, nowIso, slugify, shortId } from "./utils.ts";

const yamlBlock = (obj: Record<string, unknown>) => {
  const lines = Object.entries(obj).map(([key, value]) => {
    if (typeof value === "boolean" || typeof value === "number") {
      return `${key}: ${value}`;
    }

    if (Array.isArray(value)) {
      const nested = value
        .map((item) => `  - ${String(item).replace(/"/g, '\\"')}`)
        .join("\n");
      return `${key}:\n${nested}`;
    }

    if (value == null) {
      return `${key}:`;
    }

    return `${key}: ${JSON.stringify(String(value))}`;
  });

  return `---\n${lines.join("\n")}\n---\n`;
};

const workOrderTemplate = (spec: CallSpec, issueSlug: string): string => {
  const issueFrontMatter = yamlBlock({
    title: `${spec.customer.customer_name}: ${spec.product_area} escalation`,
    type: "fde_work_order",
    status: "investigating",
    source: spec.source,
    customer: spec.customer.customer_name,
    contact: spec.customer.contact_name,
    contact_phone: spec.caller_phone,
    tenant: spec.customer.tenant,
    plan: spec.customer.plan,
    repo: spec.repo,
    severity: spec.risk_level,
    requires_human_approval: spec.requires_human_approval,
    created_at: spec.created_at,
    issue_slug: issueSlug,
  });

  const timeline = [
    `- ${spec.created_at} | ${spec.channel} escalation from ${spec.customer.contact_name} at ${spec.customer.customer_name}`,
    `- Account context: ${spec.customer.business_context}`,
    `- Promise: ${spec.customer.promised_feature} on ${spec.customer.promised_on}`,
    `- Customer report: ${spec.user_pain}`,
    `- Product area: ${spec.product_area}`,
    `- Risk: ${spec.risk_level}`,
    `- Requires human approval: ${spec.requires_human_approval}`,
  ];

  return `${issueFrontMatter}
# FieldStack Work Order: ${spec.customer.customer_name}

## Customer escalation

${spec.user_pain}

## Customer memory

- Customer: ${spec.customer.customer_name}
- Contact: ${spec.customer.contact_name} (${spec.customer.contact_role})
- Plan: ${spec.customer.plan}
- Tenant: ${spec.customer.tenant}
- Promised feature: ${spec.customer.promised_feature}
- Promised on: ${spec.customer.promised_on}
- Business context: ${spec.customer.business_context}

## GStack execution policy

${spec.gstack_flow.map((step) => `- /${step}`).join("\n")}

## Acceptance criteria

${spec.acceptance_criteria.map((item) => `- ${item}`).join("\n")}

## Reproduction

${spec.repro_steps.map((step) => `- ${step}`).join("\n")}

## Timeline

${timeline.map((item) => `- ${item}`).join("\n")}
`;
};

const callerTemplate = (spec: CallSpec, callerSlug: string, issueSlug: string): string => {
  const frontMatter = yamlBlock({
    title: `${spec.customer.contact_name} (${spec.customer.customer_name})`,
    type: "customer_contact",
    source: spec.source,
    customer: spec.customer.customer_name,
    role: spec.customer.contact_role,
    phone: spec.caller_phone,
    last_seen_at: spec.created_at,
  });
  return `${frontMatter}
# ${callerSlug}

## Notes

- Customer: [[customers/${slugify(spec.customer.customer_name)}]]
- Came in via ${spec.channel} on ${spec.created_at}
- Reported: ${spec.user_pain}
- Linked work order: [[${issueSlug}]]
`;
};

const meetingTemplate = (spec: CallSpec, meetingSlug: string): string => {
  const frontMatter = yamlBlock({
    title: `${spec.customer.customer_name} escalation call ${spec.created_at.slice(0, 19)}`,
    type: "customer_call",
    source: spec.source,
    customer: spec.customer.customer_name,
    participant: spec.customer.contact_name,
    phone: spec.caller_phone,
    created_at: spec.created_at,
  });
  return `${frontMatter}
# ${meetingSlug}

## Transcript / Notes

${spec.user_pain}

## Raw transcript payload

FieldStack normalized this into a customer-aware GStack work order.
`;
};

const customerTemplate = (spec: CallSpec, customerSlug: string, issueSlug: string): string => {
  const frontMatter = yamlBlock({
    title: spec.customer.customer_name,
    type: "customer",
    plan: spec.customer.plan,
    tenant: spec.customer.tenant,
    primary_contact: spec.customer.contact_name,
    last_seen_at: spec.created_at,
  });

  return `${frontMatter}
# ${spec.customer.customer_name}

## Current compiled truth

- Plan: ${spec.customer.plan}
- Tenant: ${spec.customer.tenant}
- Primary contact: ${spec.customer.contact_name} (${spec.customer.contact_role})
- Promised feature: ${spec.customer.promised_feature}
- Promised on: ${spec.customer.promised_on}
- Repo: ${spec.repo}

## Customer engineering memory

${spec.customer.business_context}

## Timeline

- ${spec.created_at}: ${spec.customer.contact_name} reported: ${spec.user_pain}
- Work order: [[${issueSlug}]]
`;
};

const projectTemplate = (repo: string): string => {
  const slug = `projects/${slugify(repo)}`;
  const frontMatter = yamlBlock({
    title: repo,
    type: "project",
    source: "fieldstack_bootstrap",
    primary_language: "typescript",
    channel: "customer_fde",
  });

  return {
    slug,
    body: `${frontMatter}
# ${repo}

## FieldStack integration

- Local repair target: ${repo}
- GBrain wiring generated by FieldStack orchestrator.
- Keep account-specific work orders under \`work-orders/\`.
`,
  };
};

const writePage = async (page: PageSpec) => {
  const command = cfg.gbrainBinary;
  const args = ["put", page.slug];
  const result = await runCommand(command, args, {
    input: page.body,
    timeoutMs: 30000,
  });

  if (result.code !== 0) {
    throw new Error(
      `gbrain put failed (${page.slug}): ${result.stderr || result.stdout || "unknown error"}`,
    );
  }
};

export const buildIssueIdentity = (spec: CallSpec) => {
  const day = spec.created_at.slice(0, 10);
  const cleanPhone = spec.caller_phone.replace(/\D/g, "").slice(0, 12) || "unknown";
  const kind = spec.type.replace(/_/g, "-");
  const customer = slugify(spec.customer.customer_name);
  const issueSlug = `work-orders/${customer}-${kind}-${day}-${shortId()}`;
  const callerSlug = `contacts/${customer}-${slugify(spec.customer.contact_name || spec.caller_name || spec.caller_phone)}`;
  const meetingSlug = `interactions/${customer}-${day}-${cleanPhone}-${shortId()}`;
  const customerSlug = `customers/${customer}`;
  const projectSlug = `projects/${slugify(spec.repo)}`;
  return { issueSlug, callerSlug, meetingSlug, customerSlug, projectSlug };
};

export const persistToGBrain = async (spec: CallSpec): Promise<{
  issueSlug: string;
  callerSlug: string;
  meetingSlug: string;
  customerSlug: string;
  projectSlug: string;
}> => {
  const { issueSlug, callerSlug, meetingSlug, customerSlug } = buildIssueIdentity(spec);
  const project = projectTemplate(spec.repo);

  console.log("[fieldstack] persist start", issueSlug, callerSlug, meetingSlug, customerSlug, project.slug);

  await writePage({ slug: customerSlug, body: customerTemplate(spec, customerSlug, issueSlug) });
  console.log("[fieldstack] persisted customer", customerSlug);
  await writePage({ slug: issueSlug, body: workOrderTemplate(spec, issueSlug) });
  console.log("[fieldstack] persisted work order", issueSlug);
  await writePage({ slug: callerSlug, body: callerTemplate(spec, callerSlug, issueSlug) });
  console.log("[fieldstack] persisted contact", callerSlug);
  await writePage({ slug: meetingSlug, body: meetingTemplate(spec, meetingSlug) });
  console.log("[fieldstack] persisted interaction", meetingSlug);
  await writePage(project);
  console.log("[fieldstack] persisted project", project.slug);

  return {
    issueSlug,
    callerSlug,
    meetingSlug,
    customerSlug,
    projectSlug: project.slug,
  };
};

export const getPage = async (slug: string): Promise<string | null> => {
  const result = await runCommand(cfg.gbrainBinary, ["get", slug], {
    timeoutMs: 10000,
  });
  if (result.code !== 0) return null;
  const content = result.stdout.trim();
  return content.length > 0 ? content : null;
};

export const appendInteractionToWorkOrder = async (spec: CallSpec, issueSlug: string) => {
  const page = await getPage(issueSlug);
  if (!page) return { appended: false, reason: "work_order_missing" };
  if (page.includes(spec.event_id)) {
    return { appended: false, reason: "duplicate_event" };
  }

  const header = "## Duplicate escalations";
  const cleanPain = spec.user_pain.replace(/\s+/g, " ").trim();
  const line = `- ${spec.created_at} | ${spec.customer.contact_name} (${spec.channel}): ${cleanPain}`;

  const normalized = page.trimEnd();
  let next = normalized;
  if (normalized.includes(header)) {
    if (!normalized.includes(line)) {
      next = `${normalized}\n${line}`;
    }
  } else {
    next = `${normalized}\n\n${header}\n${line}`;
  }

  await writePage({ slug: issueSlug, body: `${next}\n` });
  return { appended: true };
};

export const searchGBrain = async (query: string, limit = 3): Promise<string[]> => {
  const result = await runCommand(cfg.gbrainBinary, ["search", query, "--limit", String(limit)], {
    timeoutMs: 10000,
  });

  if (result.code !== 0) return [];

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^No results\.?$/i.test(line))
    .slice(0, limit);
};

export type WorkOrderMatch = {
  issue_slug: string;
  reason: string;
  confidence_score: number;
};

const slugCandidate = (line: string): string | undefined => {
  const match = line.match(/\b(work-orders\/[a-z0-9_-]+(?:-[a-z0-9_-]+)*)/i);
  return match?.[1]?.toLowerCase();
};

const hasOpenHint = (line: string) => {
  const lower = line.toLowerCase();
  return [
    "status: investigating",
    "status: pending",
    "status: queued",
    "status: open",
    "requires human approval",
    "gstack",
  ].some((hint) => lower.includes(hint));
};

const hasClosedHint = (line: string) => {
  const lower = line.toLowerCase();
  return [
    "status: closed",
    "status: done",
    "status: resolved",
    "status: complete",
    "status: fixed",
    "status: no action needed",
  ].some((hint) => lower.includes(hint));
};

const extractField = (body: string, field: string): string | undefined => {
  const pattern = new RegExp(`^${field}:\\s*(.+)$`, "im");
  const match = body.match(pattern);
  if (!match) return undefined;
  return match[1].trim().replace(/^"|"$/g, "");
};

const parseDateLine = (line: string): number | undefined => {
  const match = line.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) return undefined;
  const parsed = Date.parse(match[1]);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const recencyBonus = (isoDate?: number) => {
  if (!isoDate) return 0;
  const ageMs = Date.now() - isoDate;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return 0;
  if (ageDays <= 1) return 12;
  if (ageDays <= 3) return 8;
  if (ageDays <= 7) return 4;
  return 0;
};

const scoreCandidate = (candidate: {
  customer: string;
  productArea: string;
  plan?: string;
  tenant?: string;
  queryHit: string;
  pageBody?: string;
  contact?: string;
}) => {
  const normalizedCustomer = candidate.customer.toLowerCase();
  const normalizedProduct = candidate.productArea.toLowerCase();
  const normalizedPlan = candidate.plan?.toLowerCase();
  const normalizedTenant = candidate.tenant?.toLowerCase();
  const normalizedContact = candidate.contact?.toLowerCase();

  const line = `${candidate.queryHit}\n${candidate.pageBody ?? ""}`.toLowerCase();
  const pageCustomer = extractField(candidate.pageBody ?? "", "customer")?.toLowerCase();
  const pagePlan = extractField(candidate.pageBody ?? "", "plan")?.toLowerCase();
  const pageTenant = extractField(candidate.pageBody ?? "", "tenant")?.toLowerCase();
  const pageContact = extractField(candidate.pageBody ?? "", "contact")?.toLowerCase();
  const status = extractField(candidate.pageBody ?? "", "status")?.toLowerCase();

  let score = 0;
  if (pageCustomer === normalizedCustomer || line.includes(normalizedCustomer)) score += 45;
  if (normalizedPlan && (pagePlan === normalizedPlan || line.includes(normalizedPlan))) score += 18;
  if (normalizedTenant && (pageTenant === normalizedTenant || line.includes(normalizedTenant))) score += 12;
  if (normalizedProduct && line.includes(normalizedProduct)) score += 16;
  if (normalizedContact && (pageContact === normalizedContact || line.includes(normalizedContact))) score += 10;

  if (status) {
    if (
      status.includes("investigating") ||
      status.includes("open") ||
      status.includes("pending") ||
      status.includes("queued")
    ) {
      score += 22;
    }
    if (status.includes("closed") || status.includes("resolved") || status.includes("done") || status.includes("complete")) {
      score -= 18;
    }
  }

  if (hasOpenHint(line)) score += 22;
  if (hasClosedHint(line)) score -= 22;

  const lineDate = parseDateLine(line);
  score += recencyBonus(lineDate);

  return { score: Math.max(0, Math.min(100, score + 8)), status };
};

const reasonForMatch = (match: { status?: string; source: string; slug: string }) => {
  if (match.status) {
    return `Matched ${match.slug} (status ${match.status}) via ${match.source}`;
  }
  return `Matched ${match.slug} via ${match.source}`;
};

export const findExistingWorkOrder = async (
  customer: string,
  productArea: string,
  plan?: string,
  tenant?: string,
  contact?: string,
): Promise<WorkOrderMatch | undefined> => {
  const baseCustomer = customer.trim().toLowerCase();
  const queries = [
    `${customer} ${productArea} work order ${plan || ""}`.trim(),
    `${customer} ${productArea} escalation`,
    `${tenant ? `${tenant} ` : ""}${productArea} work order`,
    `${customer} work-orders`,
    baseCustomer,
  ];

  const seen = new Set<string>();
  const candidates: Array<{ slug: string; line: string; score: number; status?: string }> = [];

  for (const query of queries) {
    const hits = await searchGBrain(query, 6);
    for (const hit of hits) {
      const slug = slugCandidate(hit);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const page = await getPage(slug);
      const { score, status } = scoreCandidate({
        customer,
        productArea,
        plan,
        tenant,
        contact,
        queryHit: hit,
        pageBody: page ?? undefined,
      });
      if (score < 55) continue;

      candidates.push({ slug, line: hit, score, status });
    }
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];

  if (!best) return undefined;

  return {
    issue_slug: best.slug,
    reason: reasonForMatch(best),
    confidence_score: best.score,
  };
};

export const gbrainStatus = async () => {
  const check = await runCommand(cfg.gbrainBinary, ["providers", "test", "--touchpoint", "chat"], {
    timeoutMs: 5000,
  });
  if (check.code === 0) {
    return { ready: true, output: check.stdout };
  }
  return { ready: false, output: check.stdout + check.stderr };
};

export const touchpoint = () => nowIso();
