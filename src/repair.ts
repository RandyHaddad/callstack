import { cfg, hasPath } from "./config.ts";
import { CallSpec, RepairResult } from "./types.ts";
import { runCommand } from "./utils.ts";
import { nowIso } from "./utils.ts";
import { runGStackSprint } from "./gstack-runner.ts";

const parseJsonFromText = (text: string): RepairResult | null => {
  try {
    const match = text.match(/\\{[\\s\\S]*\\}$/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      status: parsed.status === "success" || parsed.status === "blocked" || parsed.status === "failed"
        ? parsed.status
        : "running",
      mode: parsed.mode ?? "noop",
      branch: parsed.branch,
      commit: parsed.commit,
      changed_files: Array.isArray(parsed.changed_files) ? parsed.changed_files : [],
      notes: parsed.notes || "No notes provided.",
      preview_url: parsed.preview_url,
      qa_result: parsed.qa_result,
    };
  } catch {
    return null;
  }
};

const runCodexSprint = async (spec: CallSpec): Promise<RepairResult> => {
  const repo = spec.repo;
  if (!hasPath(repo)) {
    return {
      status: "failed",
      mode: "codex",
      changed_files: [],
      notes: `Repo path not found: ${repo}`,
    };
  }

  const prompt = `
You are FieldStack, a GStack/GBrain-powered AI FDE operating inside a customer repo.
Use the installed gstack workflow mindset in this order:
investigate -> browse -> plan-eng-review -> review -> qa -> ship.

Issue to fix:
${JSON.stringify(spec, null, 2)}

Rules:
- Make the smallest safe fix first.
- Use the customer/account context when deciding severity and acceptance criteria.
- Do not run dangerous scripts.
- Include a clear test/verification plan.
- If you can fix code, do it and run tests or checks.
- Return strict JSON only in the final response with keys:
  status, changed_files, notes, branch, qa_result, preview_url.
- If you cannot safely fix, set status blocked and explain.
`;

  const scratch = `/tmp/callstack-codex-${spec.event_id}.json`;
  const args = [
    "exec",
    "--sandbox",
    "danger-full-access",
    "--cd",
    repo,
    "--output-last-message",
    scratch,
  ];

  const result = await runCommand(cfg.codexBinary, args, {
    input: prompt,
    timeoutMs: 300000,
  });

  const fallback: RepairResult = {
    status: "failed",
    mode: "codex",
    changed_files: [],
    notes: `Codex command failed with code ${result.code}. stdout: ${result.stdout} stderr: ${result.stderr}`,
  };

  if (result.code !== 0) {
    return fallback;
  }

  try {
    const lastMessage = await Bun.file(scratch).text();
    const parsed = parseJsonFromText(lastMessage);
    if (parsed) {
      return { ...parsed, status: parsed.status, mode: "codex" };
    }
  } catch {
    // continue to fallback parsing
  }

  const parsed = parseJsonFromText(result.stdout);
  if (parsed) {
    return { ...parsed, status: parsed.status, mode: "codex" };
  }

  return {
    status: "success",
    mode: "codex",
    changed_files: [],
    notes: result.stdout || "Codex ran, but did not return structured output.",
    qa_result: result.stderr || undefined,
  };
};

const runScriptRepair = async (spec: CallSpec): Promise<RepairResult> => {
  if (!cfg.repairScript) {
    return {
      status: "failed",
      mode: "script",
      changed_files: [],
      notes: "CALLSTACK_REPAIR_SCRIPT not configured.",
    };
  }

  const command = cfg.repairScript;
  const result = await runCommand("bash", ["-lc", command], {
    cwd: spec.repo,
    env: {
      CALLSTACK_EVENT_ID: spec.event_id,
      CALLSTACK_SPEC_JSON: JSON.stringify(spec),
      CALLSTACK_REPAIR_TS: nowIso(),
    },
    timeoutMs: 300000,
  });

  if (result.code !== 0) {
    return {
      status: "failed",
      mode: "script",
      changed_files: [],
      notes: `Script failed: ${result.stderr || result.stdout}`,
    };
  }

  return {
    status: "success",
    mode: "script",
    changed_files: [],
    notes: result.stdout || "Script completed.",
  };
};

export const runRepairLoop = async (spec: CallSpec): Promise<RepairResult> => {
  if (cfg.repairMode === "gstack") {
    return runGStackSprint(spec);
  }

  if (cfg.repairMode === "codex") {
    return runCodexSprint(spec);
  }

  if (cfg.repairMode === "script") {
    return runScriptRepair(spec);
  }

  return {
    status: "queued",
    mode: "noop",
    changed_files: [],
    notes: "Repair mode is noop. Enable CALLSTACK_AUTO_REPAIR or provide a repair command.",
  };
};
