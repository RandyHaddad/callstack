import { cfg } from "./config.ts";
import { CallSpec } from "./types.ts";
import { nowIso } from "./utils.ts";

type RawExtraction = {
  type: "bug_report" | "feature_request" | "question" | "feedback";
  product_area: string;
  user_pain: string;
  repro_steps: string[];
  expected_behavior: string;
  acceptance_criteria: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  requires_human_approval: boolean;
  repo: string;
};

type ExtractedCallSpec = Omit<CallSpec, "source" | "event_id" | "caller_phone" | "caller_name" | "caller_id" | "customer" | "raw_payload" | "channel" | "created_at">;

const heuristicFallback = (text: string, fallbackRepo: string): ExtractedCallSpec => {
  const lower = text.toLowerCase();

  const maybeProduct = ["export", "reports", "csv", "signup", "button", "checkout", "search", "login", "billing", "mobile", "profile"];
  const chosenArea =
    maybeProduct.find((area) => lower.includes(area)) ?? "product_experience";

  const requiresApproval = /delete|refund|billing|payment|security|data|credentials|payout|charge|deploy|production/i.test(lower);
  const risk: RawExtraction["risk_level"] = /enterprise|promised|still missing|crash|down|security|payment|data|credential|delete|refund/i.test(lower)
    ? "high"
    : /bug|error|broken|missing|hidden|doesn’t|doesnt|can't|cannot|not/i.test(lower)
      ? "medium"
      : "low";

  const steps = [
    "Open the customer's tenant in the relevant product area.",
    "Reproduce the customer-reported behavior.",
    "Verify the fix in browser QA before requesting approval.",
  ];

  const expected = "The customer-reported behavior is reproduced, fixed or scoped, and verified against the account context in GBrain.";

  const criteria = lower.includes("export")
    ? [
        "CSV export button is visible for the Acme Enterprise tenant.",
        "CSV export button remains hidden only for plans without export entitlement.",
        "Browser QA confirms the reports dashboard shows export for Enterprise.",
      ]
    : [
        "The reported path is fixed as described by the customer.",
        "GBrain work order contains customer, issue, account context, and acceptance criteria.",
        "GStack run artifact shows investigate, review, QA, and approval-gated ship steps.",
        "No regression in smoke test path relevant to the issue.",
      ];

  return {
    type: "bug_report",
    product_area: chosenArea,
    user_pain: text.trim(),
    repro_steps: steps,
    expected_behavior: expected,
    acceptance_criteria: criteria,
    risk_level: risk,
    requires_human_approval: requiresApproval,
    repo: fallbackRepo,
    gstack_flow: ["investigate", "browse", "plan-eng-review", "review", "qa", "ship"],
  };
};

export const extractCallSpec = async (
  message: string,
  fallbackRepo: string,
): Promise<ExtractedCallSpec> => {
  if (cfg.enableLlmExtraction !== "1" || !cfg.openAiApiKey) {
    return heuristicFallback(message, fallbackRepo);
  }

  const prompt = `
You are FieldStack spec extractor. Parse the customer's escalation into strict JSON with this schema:
{
  "type": "bug_report|feature_request|question|feedback",
  "product_area": "reports|export|signup|checkout|mobile|search|billing|account|other",
  "user_pain": "one sentence summary",
  "repro_steps": ["step 1", "step 2"],
  "expected_behavior": "expected behavior sentence",
  "acceptance_criteria": ["criterion 1", "criterion 2"],
  "risk_level": "low|medium|high|critical",
  "requires_human_approval": false,
  "repo": "${fallbackRepo}",
  "gstack_flow": ["investigate", "browse", "plan-eng-review", "review", "qa", "ship"]
}

Constraints:
- Output JSON only, no markdown.
- Keep acceptance_criteria short and executable.
- Infer product_area from keywords when possible.
- If repo is missing, set repo to "${fallbackRepo}".
Message:
${message}
`;

  try {
    const response = await fetch(`${cfg.openAiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: cfg.openAiModel,
        messages: [
      { role: "system", content: "You extract customer-aware FDE engineering work orders." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return heuristicFallback(message, fallbackRepo);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return heuristicFallback(message, fallbackRepo);
    }

    const parsed = JSON.parse(content) as RawExtraction;
    return {
      type: parsed.type ?? "bug_report",
      product_area: parsed.product_area || "product_experience",
      user_pain: parsed.user_pain || message,
      repro_steps: parsed.repro_steps?.length ? parsed.repro_steps : ["TBD"],
      expected_behavior: parsed.expected_behavior || "Behavior matches expectation from user report.",
      acceptance_criteria: parsed.acceptance_criteria?.length
        ? parsed.acceptance_criteria
        : ["Customer flow is fixed."],
      risk_level: parsed.risk_level || "medium",
      requires_human_approval: !!parsed.requires_human_approval,
      repo: parsed.repo || fallbackRepo,
      gstack_flow: ["investigate", "browse", "plan-eng-review", "review", "qa", "ship"],
    };
  } catch (err) {
    return heuristicFallback(`${message}\n[fallback due error: ${String((err as Error).message)}]`, fallbackRepo);
  }
};

export const timestamp = () => nowIso();
