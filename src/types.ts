export type EventKind = "call" | "sms" | "message" | "transcript";

export type AgentphoneEvent = {
  event?: "agent.message" | "agent.call_ended" | "agent.reaction" | string;
  event_type?: string;
  id?: string;
  kind?: EventKind;
  source?: string;
  timestamp?: string;
  created_at?: string;
  from?: { phone?: string; number?: string; name?: string; id?: string };
  caller?: { phone?: string; number?: string; name?: string; id?: string };
  to?: { phone?: string; number?: string };
  transcript?: string;
  message?: string;
  body?: string;
  text?: string;
  raw_text?: string;
  channel?: "voice" | "sms" | "mms" | "imessage" | "web";
  agentId?: string;
  data?: {
    callId?: string;
    conversationId?: string;
    numberId?: string;
    from?: string;
    to?: string;
    message?: string;
    transcript?: string | Array<{ role?: string; content?: string }>;
    summary?: string;
    confidence?: number;
    status?: string;
    direction?: string;
    receivedAt?: string;
  };
  conversationState?: Record<string, unknown> | null;
  recentHistory?: Array<{ content?: string; direction?: string; channel?: string; at?: string }>;
  metadata?: Record<string, unknown>;
};

export type ProductIssueSeverity = "low" | "medium" | "high" | "critical";

export type CustomerContext = {
  customer_name: string;
  contact_name: string;
  contact_role: string;
  plan: string;
  tenant: string;
  promised_feature: string;
  promised_on: string;
  business_context: string;
  memory_hits?: string[];
};

export type CallSpec = {
  source: "agentphone_call" | "agentphone_sms" | "agentphone_message";
  event_id: string;
  caller_phone: string;
  caller_name: string;
  caller_id?: string;
  customer: CustomerContext;
  repo: string;
  type: "bug_report" | "feature_request" | "question" | "feedback";
  product_area: string;
  user_pain: string;
  repro_steps: string[];
  expected_behavior: string;
  acceptance_criteria: string[];
  risk_level: ProductIssueSeverity;
  requires_human_approval: boolean;
  gstack_flow: string[];
  raw_payload: Record<string, unknown>;
  channel: "voice" | "sms" | "text";
  created_at: string;
};

export type PageSpec = {
  slug: string;
  title: string;
  body: string;
};

export type RepairResult = {
  status: "queued" | "running" | "success" | "blocked" | "failed";
  mode: "codex" | "gstack" | "script" | "noop";
  branch?: string;
  commit?: string;
  changed_files: string[];
  notes: string;
  preview_url?: string;
  qa_result?: string;
  run_id?: string;
  run_path?: string;
  gstack_steps?: Array<{
    skill: string;
    role: string;
    status: "complete" | "blocked" | "skipped";
    summary: string;
  }>;
};

export type NotifyResult = {
  status: "sent" | "blocked" | "stubbed" | "failed";
  channel: "agentphone_sms" | "agentmail_email" | "webhook" | "stub";
  notes: string;
  response?: unknown;
};
