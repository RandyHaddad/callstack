import { cfg } from "./config.ts";
import { agentPhoneConversationDecision, ConversationDecision } from "./conversation.ts";
import { AgentphoneEvent } from "./types.ts";

const textFromEvent = (event: AgentphoneEvent) => {
  const transcript = event.data?.transcript;
  if (Array.isArray(transcript)) {
    return transcript.map((turn) => turn.content).filter(Boolean).join("\n");
  }

  return transcript || event.data?.message || event.data?.summary || event.transcript || event.message || event.body || event.text || "";
};

const historyFromEvent = (event: AgentphoneEvent) =>
  event.recentHistory?.map((turn) => turn.content).filter(Boolean).join("\n") || "";

const parseText = (content: unknown): string | undefined => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return String((part as { text?: unknown }).text ?? "");
        return "";
      })
      .join("")
      .trim();
  }
  return undefined;
};

const responsesRequest = async (model: string, system: string, user: string) => {
  const response = await fetch(`${cfg.openAiBase}/responses`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.openAiApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: user }],
        },
      ],
      text: { verbosity: "medium" },
      temperature: 0.35,
      max_output_tokens: 90,
    }),
  });

  const payloadText = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${payloadText}`);
  }

  return JSON.parse(payloadText);
};

const textFromPayload = (payload: unknown): string | undefined => {
  const data = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  const responseText = data.output_text || data.output
    ?.flatMap((item) => item.content || [])
    ?.map((part) => part.text)
    ?.filter(Boolean)
    ?.join("");
  return parseText(responseText)?.replace(/^["']|["']$/g, "").trim();
};

export const realtimeAgentPhoneConversationDecision = async (event: AgentphoneEvent): Promise<ConversationDecision> => {
  const base = agentPhoneConversationDecision(event);
  if (!cfg.openAiApiKey) return { ...base, modelMode: "deterministic", modelError: "OPENAI_API_KEY missing" };

  const transcript = textFromEvent(event);
  const history = historyFromEvent(event);

  const system = [
    "You are FieldStack, a phone-native AI forward deployed engineer.",
    "You are speaking live on a phone call via AgentPhone.",
    "Keep replies under 22 words unless saying goodbye.",
    "Sound capable, direct, and calm. No filler. No apologies.",
    "If the deterministic draft found a customer in GBrain, do not ask for customer identity again.",
    "Do not promise SMS delivery mechanics; say you will send a follow-up.",
    "Preserve the operational intent of the provided draft exactly.",
  ].join(" ");

  const user = JSON.stringify({
    caller_transcript: transcript,
    recent_history: history,
    deterministic_draft: base.text,
    should_process: base.shouldProcess,
    missing_slot: base.missingSlot,
    hangup: base.hangup,
  });

  const attempts = [
    { model: cfg.realtimeModel, mode: "realtime" as const },
    { model: cfg.conversationModel, mode: "text" as const },
  ].filter((attempt, index, all) => all.findIndex((item) => item.model === attempt.model) === index);

  let lastError = "";
  try {
    for (const attempt of attempts) {
      try {
        const payload = await responsesRequest(attempt.model, system, user);
        const text = textFromPayload(payload);
        if (!text) {
          lastError = `${attempt.model} returned no text`;
          continue;
        }

        return {
          ...base,
          text,
          model: attempt.model,
          modelMode: attempt.mode,
          ...(lastError ? { modelError: lastError.slice(0, 240) } : {}),
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`[fieldstack] conversation model failed: ${attempt.model}`, lastError.slice(0, 500));
      }
    }

    return { ...base, modelMode: "deterministic", modelError: lastError.slice(0, 240) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[fieldstack] conversation error", message);
    return { ...base, modelMode: "deterministic", modelError: message.slice(0, 240) };
  }
};
