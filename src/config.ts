import { accessSync } from "node:fs";

export type RepairMode = "codex" | "gstack" | "script" | "noop";

const required = (name: string, fallback = "") => {
  const value = process.env[name];
  return value ?? fallback;
};

export const cfg = {
  port: Number(required("PORT", "8787")),
  webhookPath: required("CALLSTACK_WEBHOOK_PATH", "/agentphone/events"),
  repoFallback: required("CALLSTACK_DEFAULT_REPO", "/Users/randyhaddad/Desktop/GBrain Hackathon/callstack/demo-app"),
  gbrainBinary: required("GBRAIN_BINARY", "gbrain"),
  codexBinary: required("CODEX_BINARY", "codex"),
  repairMode: required("CALLSTACK_REPAIR_MODE", "noop") as RepairMode,
  repairScript: required("CALLSTACK_REPAIR_SCRIPT", ""),
  repairCommand: required("CALLSTACK_REPAIR_COMMAND", ""),
  gstackHome: required("GSTACK_HOME", "/Users/randyhaddad/Desktop/GBrain Hackathon/gstack"),
  enableLlmExtraction: required("CALLSTACK_ENABLE_LLM_EXTRACTION", "0"),
  enableRealtimeConversation: required("CALLSTACK_ENABLE_REALTIME_CONVERSATION", "0") === "1",
  realtimeModel: required("CALLSTACK_REALTIME_MODEL", "gpt-realtime"),
  conversationModel: required("CALLSTACK_CONVERSATION_MODEL", "gpt-4o-mini"),
  openAiApiKey: required("OPENAI_API_KEY", ""),
  openAiModel: required("CALLSTACK_EXTRACTION_MODEL", "gpt-4o"),
  openAiBase: required("OPENAI_API_BASE", "https://api.openai.com/v1"),
  notifyWebhook: required("CALLSTACK_NOTIFY_WEBHOOK", ""),
  notifyFromName: required("CALLSTACK_NOTIFY_FROM_NAME", "FieldStack"),
  outboundSmsEnabled: required("CALLSTACK_OUTBOUND_SMS_ENABLED", "0") === "1",
  agentPhoneApiKey: required("AGENTPHONE_API_KEY", ""),
  agentPhoneAgentId: required("AGENTPHONE_AGENT_ID", "cmp8vmaei050lyf5r83jgd9lb"),
  agentPhoneNumberId: required("AGENTPHONE_NUMBER_ID", "cmp8vmi7u050nyf5rc5m5qzih"),
  agentPhoneBase: required("AGENTPHONE_API_BASE", "https://api.agentphone.ai/v1"),
  agentMailApiKey: required("AGENTMAIL_API_KEY", ""),
  agentMailInboxId: required("AGENTMAIL_INBOX_ID", ""),
  agentMailBase: required("AGENTMAIL_API_BASE", "https://api.agentmail.to/v0"),
  customerEmailFallback: required("CALLSTACK_CUSTOMER_EMAIL", ""),
  logLevel: required("CALLSTACK_LOG_LEVEL", "info"),
  autoNotify: required("CALLSTACK_AUTO_NOTIFY", "1") === "1",
  autoRepair: required("CALLSTACK_AUTO_REPAIR", "0") === "1",
  requireCallerApproval: required("CALLSTACK_REQUIRE_APPROVAL", "0") === "1",
  skipExistingEvents: required("CALLSTACK_SKIP_EXISTING_EVENTS", "1") === "1",
  gstackSignalWebhook: required("CALLSTACK_GSTACK_WEBHOOK", ""),
};

export const hasPath = (path: string): boolean => {
  try {
    accessSync(path);
    return true;
  } catch {
    return false;
  }
};
