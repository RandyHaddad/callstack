import { mkdir } from "node:fs/promises";
import { cfg, hasPath } from "./config.ts";
import { CallSpec, RepairResult } from "./types.ts";
import { slugify } from "./utils.ts";

type GStackStep = NonNullable<RepairResult["gstack_steps"]>[number];

const skills = [
  { skill: "investigate", role: "Root-cause FDE", summary: "Use GBrain context plus the customer report to identify the smallest reproducible issue." },
  { skill: "plan-eng-review", role: "Engineering manager", summary: "Check risk, blast radius, and acceptance criteria before changing code." },
  { skill: "review", role: "Production reviewer", summary: "Review the patch or work order for production and customer-risk gaps." },
  { skill: "qa", role: "QA lead", summary: "Verify the customer path against acceptance criteria." },
  { skill: "ship", role: "Release engineer", summary: "Prepare the approval-gated ship handoff." },
] as const;

const readSkillDescription = async (skill: string) => {
  const skillFile = `${cfg.gstackHome}/${skill}/SKILL.md`;
  if (!hasPath(skillFile)) return "GStack skill file not found; using FieldStack fallback policy.";
  const text = await Bun.file(skillFile).text();
  const match = text.match(/description:\s*\|\n([\s\S]*?)(?:\n[a-zA-Z-]+:|\n---)/);
  return match?.[1]?.split("\n").map((line) => line.trim()).filter(Boolean).join(" ") || "GStack skill loaded.";
};

const buildRunId = (spec: CallSpec) =>
  `${slugify(spec.customer.customer_name)}-${slugify(spec.product_area)}-${Date.now().toString(36)}`;

const shouldApplyExportDemoPatch = (spec: CallSpec) =>
  /\b(export|csv|report|reports|dashboard)\b/i.test(`${spec.user_pain} ${spec.product_area} ${spec.expected_behavior}`);

const gbrainSummary = (spec: CallSpec) =>
  spec.customer.memory_hits?.length
    ? `GBrain recall: ${spec.customer.memory_hits.join(" | ")}`
    : `GBrain recall: ${spec.customer.customer_name} ${spec.customer.plan} tenant ${spec.customer.tenant}; ${spec.customer.business_context}`;

const demoPatch = async (spec: CallSpec): Promise<{ changedFiles: string[]; patchSummary: string; qa: string; blocked?: string; rootCause: string }> => {
  const indexPath = `${spec.repo}/index.html`;
  if (!shouldApplyExportDemoPatch(spec)) {
    return {
      changedFiles: [],
      patchSummary: `Generated a GStack work order for ${spec.product_area}: ${spec.user_pain}`,
      qa: `QA plan ready from acceptance criteria: ${spec.acceptance_criteria.join("; ")}`,
      rootCause: `Investigation scoped from caller report plus ${gbrainSummary(spec)}`,
    };
  }

  if (!hasPath(indexPath)) {
    return {
      changedFiles: [],
      patchSummary: "No patch applied.",
      qa: "QA blocked because demo-app/index.html was not found.",
      rootCause: "Export issue matched the demo patch lane, but the demo repo file was missing.",
      blocked: `Missing ${indexPath}`,
    };
  }

  const before = await Bun.file(indexPath).text();
  const brokenGate = 'const canExport = plan === "pro";';
  const fixedGate = 'const canExport = ["pro", "enterprise"].includes(plan);';

  if (before.includes(fixedGate)) {
    return {
      changedFiles: [],
      patchSummary: "Export entitlement was already fixed for Pro and Enterprise.",
      qa: "Static QA passed: Enterprise is included in the export entitlement gate.",
      rootCause: "The Acme export path was checked against the demo repo; the entitlement gate already includes Enterprise.",
    };
  }

  if (!before.includes(brokenGate)) {
    return {
      changedFiles: [],
      patchSummary: "No known Acme export entitlement patch was applied.",
      qa: "QA blocked because the seeded entitlement gate was not found.",
      rootCause: "The customer reported an export issue, but the expected demo entitlement gate was not present.",
      blocked: "Expected demo entitlement gate was not present.",
    };
  }

  await Bun.write(indexPath, before.replace(brokenGate, fixedGate));

  const after = await Bun.file(indexPath).text();
  const qa = after.includes(fixedGate)
    ? "Static QA passed: Enterprise export gate now includes Pro and Enterprise; approval remains required before deploy."
    : "Static QA failed: fixed entitlement gate was not found after patch.";

  return {
    changedFiles: ["demo-app/index.html"],
    patchSummary: "Changed CSV export entitlement from Pro-only to Pro plus Enterprise.",
    qa,
    rootCause: "The customer is on Enterprise, but the CSV export gate only allowed Pro.",
  };
};

export const runGStackSprint = async (spec: CallSpec): Promise<RepairResult> => {
  if (!hasPath(spec.repo)) {
    return {
      status: "failed",
      mode: "gstack",
      changed_files: [],
      notes: `Repo path not found: ${spec.repo}`,
    };
  }

  const runId = buildRunId(spec);
  const runDir = `${process.cwd()}/.fieldstack/gstack-runs`;
  const runPath = `${runDir}/${runId}.md`;
  await mkdir(runDir, { recursive: true });

  const loadedSkills = await Promise.all(skills.map(async (entry) => ({
    ...entry,
    description: await readSkillDescription(entry.skill),
  })));

  const patch = await demoPatch(spec);
  const status: RepairResult["status"] = patch.blocked ? "blocked" : "success";
  const steps: GStackStep[] = loadedSkills.map((entry) => {
    if (entry.skill === "investigate") {
      return {
        skill: "/investigate",
        role: entry.role,
        status: "complete",
        summary: `Root cause / scope: ${patch.blocked ?? patch.rootCause}`,
      };
    }

    if (entry.skill === "plan-eng-review") {
      return {
        skill: "/plan-eng-review",
        role: entry.role,
        status: "complete",
        summary: `${spec.risk_level} risk; approval ${spec.requires_human_approval ? "required" : "recommended"}; acceptance criteria: ${spec.acceptance_criteria.join("; ")}`,
      };
    }

    if (entry.skill === "review") {
      return {
        skill: "/review",
        role: entry.role,
        status: patch.blocked ? "blocked" : "complete",
        summary: patch.patchSummary,
      };
    }

    if (entry.skill === "qa") {
      return {
        skill: "/qa",
        role: entry.role,
        status: patch.blocked ? "blocked" : "complete",
        summary: patch.qa,
      };
    }

    return {
      skill: "/ship",
      role: entry.role,
      status: "skipped",
      summary: "Ship is gated on customer/human approval; FieldStack will request APPROVE before deploy.",
    };
  });

  const runBody = [
    `# GStack Run: ${runId}`,
    "",
    `Customer: ${spec.customer.customer_name}`,
    `Contact: ${spec.customer.contact_name}`,
    `Repo: ${spec.repo}`,
    `Issue: ${spec.user_pain}`,
    `Business context: ${spec.customer.business_context}`,
    `GBrain memory hits: ${spec.customer.memory_hits?.join(" | ") || "No prior hits found; using live customer signal as new memory."}`,
    "",
    "## Loaded GStack Skills",
    ...loadedSkills.map((entry) => `- /${entry.skill}: ${entry.description}`),
    "",
    "## Execution",
    ...steps.map((step) => `- ${step.skill} (${step.role}) [${step.status}]: ${step.summary}`),
    "",
    "## Acceptance Criteria",
    ...spec.acceptance_criteria.map((criterion) => `- ${criterion}`),
  ].join("\n");

  await Bun.write(runPath, runBody);

  return {
    status,
    mode: "gstack",
    changed_files: patch.changedFiles,
    notes: `GStack sprint ${runId}: ${patch.patchSummary}`,
    qa_result: patch.qa,
    run_id: runId,
    run_path: runPath,
    gstack_steps: steps,
  };
};
