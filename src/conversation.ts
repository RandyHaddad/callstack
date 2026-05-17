import { AgentphoneEvent } from "./types.ts";

export type ConversationDecision = {
  text: string;
  shouldProcess: boolean;
  customer?: string;
  missingSlot?: "transcript" | "customer" | "issue";
  hangup?: boolean;
  model?: string;
  modelMode?: "realtime" | "text" | "deterministic";
  modelError?: string;
};

const acmeFdeNumbers = new Set(["14159660622", "4159660622"]);
const acmeFdeNumberIds = new Set(["cmp8vmi7u050nyf5rc5m5qzih"]);
const acmeFdeAgentIds = new Set(["cmp8vmaei050lyf5r83jgd9lb"]);
const acmeDemoCallerPhones = new Set(["14155550199", "4155550199"]);

const transcriptFrom = (event: AgentphoneEvent): string => {
  const transcript = event.data?.transcript;
  if (Array.isArray(transcript)) {
    return transcript.map((turn) => turn.content).filter(Boolean).join("\n");
  }

  return (
    transcript ||
    event.data?.message ||
    event.data?.summary ||
    event.transcript ||
    event.message ||
    event.body ||
    event.text ||
    event.raw_text ||
    ""
  );
};

const valueFromMetadata = (event: AgentphoneEvent, key: string): string | undefined => {
  const value = event.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const normalizePhone = (value?: string) => (value ?? "").replace(/\D/g, "").slice(-11);

const eventPhoneValues = (event: AgentphoneEvent) => [
  event.data?.from,
  event.data?.to,
  event.from?.phone,
  event.from?.number,
  event.caller?.phone,
  event.caller?.number,
  event.to?.phone,
  event.to?.number,
];

const isAcmeFdeLine = (event: AgentphoneEvent) =>
  eventPhoneValues(event).some((phone) => acmeFdeNumbers.has(normalizePhone(phone))) ||
  acmeFdeNumberIds.has(event.data?.numberId ?? "") ||
  acmeFdeAgentIds.has(event.agentId ?? "");

const isAcmeDemoCaller = (event: AgentphoneEvent) =>
  eventPhoneValues(event).some((phone) => acmeDemoCallerPhones.has(normalizePhone(phone)));

const stringifyContext = (event: AgentphoneEvent) => {
  const history = event.recentHistory?.map((item) => item.content).filter(Boolean).join("\n") ?? "";
  const state = event.conversationState ? JSON.stringify(event.conversationState) : "";
  const metadata = event.metadata ? JSON.stringify(event.metadata) : "";
  return `${history}\n${state}\n${metadata}`;
};

const isKnownAcmeEscalation = (text: string, event: AgentphoneEvent) => {
  const joined = `${text}\n${stringifyContext(event)}\n${valueFromMetadata(event, "customer_name") ?? ""}\n${valueFromMetadata(event, "contact_name") ?? ""}`;
  return isAcmeFdeLine(event) || isAcmeDemoCaller(event) || /acme|sarah|enterprise/i.test(joined);
};

const hasSpecificIssue = (text: string) =>
  /missing|broken|hidden|blank|empty|error|crash|slow|stuck|failed|fails|failure|not working|doesn't|doesnt|can't|cannot|button|screen|page|form|upload|download|invoice|billing|export|csv|signup|login|checkout|dashboard|report|search|settings|profile|mobile/i.test(text);

const isCallClose = (text: string) =>
  /\b(goodbye|bye|that'?s all|thanks|thank you|hang up|end the call|talk later|appreciate it)\b/i.test(text);

const hasCustomerIdentity = (text: string, event: AgentphoneEvent) =>
  Boolean(valueFromMetadata(event, "customer_name")) ||
  isAcmeFdeLine(event) ||
  isAcmeDemoCaller(event) ||
  /from\s+[a-z0-9 -]+|acme|enterprise/i.test(`${text}\n${stringifyContext(event)}`);

const customerName = (event: AgentphoneEvent, text: string) => {
  const metadataName = valueFromMetadata(event, "customer_name");
  if (metadataName) return metadataName;
  if (isKnownAcmeEscalation(text, event)) return "Acme";
  return "your account";
};

const followUpPromise = (channel: "voice" | "sms") => {
  return channel === "voice"
    ? "I’ll text back with the work order and QA result."
    : "I’ll send the work order and QA result here.";
};

export const agentPhoneConversationDecision = (event: AgentphoneEvent): ConversationDecision => {
  const text = transcriptFrom(event).trim();
  const channel = event.channel === "sms" || event.channel === "mms" ? "sms" : "voice";
  const customer = customerName(event, text);

  if (text && isCallClose(text)) {
    const existingIssueContext = hasSpecificIssue(`${text}\n${stringifyContext(event)}`);
    if (isKnownAcmeEscalation(text, event)) {
      return {
        text: existingIssueContext
          ? `Got it. I have the Acme report. ${followUpPromise(channel)} Goodbye.`
          : "Got it. I’ll close the call here. If anything breaks for Acme, call or text this number.",
        shouldProcess: existingIssueContext,
        customer: "Acme",
        hangup: channel === "voice",
      };
    }

    return {
      text: "Got it. I’ll close the call here. If anything else breaks, call or text this number.",
      shouldProcess: false,
      customer,
      hangup: channel === "voice",
    };
  }

  if (!text) {
    return {
      text: channel === "voice"
        ? "I can help. Tell me what is broken, and I’ll check the implementation history while you’re on the line."
        : "I can help. Send what is broken and I’ll check the implementation history.",
      shouldProcess: false,
      customer,
      missingSlot: "transcript",
    };
  }

  if (!hasCustomerIdentity(text, event)) {
    return {
      text: channel === "voice"
        ? "Got it. Which customer account should I attach this to?"
        : "Got it. Which customer account should I attach this to?",
      shouldProcess: false,
      customer,
      missingSlot: "customer",
    };
  }

  if (!hasSpecificIssue(text)) {
    if (isKnownAcmeEscalation(text, event)) {
      return {
        text: channel === "voice"
          ? "I have Acme in GBrain. What exact product behavior should I reproduce?"
          : "I have Acme in GBrain. What exact product behavior should I reproduce?",
        shouldProcess: false,
        customer: "Acme",
        missingSlot: "issue",
      };
    }

    return {
      text: channel === "voice"
        ? `I have ${customer}. What exact product behavior should I reproduce?`
        : `I have ${customer}. What exact product behavior should I reproduce?`,
      shouldProcess: false,
      customer,
      missingSlot: "issue",
    };
  }

  if (isKnownAcmeEscalation(text, event)) {
    return {
      text: channel === "voice"
        ? `I found Acme in GBrain. I’m turning this into a GStack work order and starting reproduction now. ${followUpPromise(channel)}`
        : `I found Acme in GBrain. I’m turning this into a GStack work order and starting reproduction now. ${followUpPromise(channel)}`,
      shouldProcess: true,
      customer: "Acme",
    };
  }

  return {
    text: channel === "voice"
      ? `I found ${customer}. I’m turning this into a GStack work order now and will text you the result after QA.`
      : `I found ${customer}. I’m turning this into a GStack work order now and will send the result after QA.`,
    shouldProcess: true,
    customer,
  };
};

export const immediateAgentPhoneReply = (event: AgentphoneEvent): string =>
  agentPhoneConversationDecision(event).text;
