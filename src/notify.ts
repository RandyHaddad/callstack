import { cfg } from "./config.ts";
import { NotifyResult } from "./types.ts";
import { addTrace } from "./trace.ts";

type FollowUpPayload = {
  to: string;
  from: string;
  text: string;
  event_id: string;
  customer?: string;
  email?: string;
};

const htmlEmail = (text: string) => `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #181818; line-height: 1.5;">
    <div style="max-width: 640px; border: 1px solid #ddd; padding: 20px;">
      <h2 style="margin: 0 0 12px;">FieldStack update</h2>
      <p style="white-space: pre-line;">${text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] ?? char))}</p>
      <p style="color: #666; font-size: 12px;">Sent by the FieldStack AI FDE control plane.</p>
    </div>
  </body>
</html>`;

const sendAgentMail = async (payload: FollowUpPayload, reason: string): Promise<NotifyResult | null> => {
  const to = payload.email || cfg.customerEmailFallback;
  if (!cfg.agentMailApiKey || !cfg.agentMailInboxId || !to) {
    return null;
  }

  const request = await fetch(`${cfg.agentMailBase}/inboxes/${encodeURIComponent(cfg.agentMailInboxId)}/messages/send`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.agentMailApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject: `FieldStack update for ${payload.customer || "your report"}`,
      text: payload.text,
      html: htmlEmail(payload.text),
      labels: ["fieldstack", "fde-follow-up"],
    }),
  });

  if (!request.ok) {
    const body = await request.text();
    const result: NotifyResult = {
      status: "failed",
      channel: "agentmail_email",
      notes: `AgentMail email failed after ${reason}: ${request.status} ${body}`,
    };
    await addTrace({
      type: "notify",
      title: "AgentMail email failed",
      detail: payload.text,
      status: "failed",
      data: result,
    });
    return result;
  }

  const response = await request.json();
  const result: NotifyResult = {
    status: "sent",
    channel: "agentmail_email",
    notes: `SMS was unavailable, so FieldStack sent the follow-up by AgentMail to ${to}.`,
    response,
  };
  await addTrace({
    type: "notify",
    title: "AgentMail email sent",
    detail: payload.text,
    status: "complete",
    data: result,
  });
  return result;
};

export const sendFollowUp = async (payload: FollowUpPayload): Promise<NotifyResult> => {
  if (!cfg.notifyWebhook) {
    if (cfg.agentPhoneApiKey && cfg.agentPhoneAgentId) {
      const request = await fetch(`${cfg.agentPhoneBase}/messages`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${cfg.agentPhoneApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          agent_id: cfg.agentPhoneAgentId,
          number_id: cfg.agentPhoneNumberId || null,
          to_number: payload.to,
          body: payload.text,
        }),
      });

      if (!request.ok) {
        const body = await request.text();
        if (request.status === 403 && body.toLowerCase().includes("outbound sms")) {
          console.warn("[fieldstack] AgentPhone follow-up blocked:", body);
          console.log("[fieldstack] notify (sms blocked, retained):", payload);
          const emailResult = await sendAgentMail(payload, "AgentPhone outbound SMS block");
          if (emailResult?.status === "sent") {
            return emailResult;
          }

          const result: NotifyResult = {
            status: "blocked",
            channel: "agentphone_sms",
            notes: emailResult
              ? emailResult.notes
              : "AgentPhone rejected outbound SMS. Configure AgentMail or complete 10DLC/outbound messaging setup.",
            response: body,
          };
          await addTrace({
            type: "notify",
            title: "SMS blocked",
            detail: payload.text,
            status: "blocked",
            data: result,
          });
          return result;
        }
        throw new Error(`AgentPhone message failed: ${request.status} ${body}`);
      }

      const response = await request.json();
      const result: NotifyResult = {
        status: "sent",
        channel: "agentphone_sms",
        notes: "Follow-up SMS sent through AgentPhone.",
        response,
      };
      console.log("[fieldstack] AgentPhone follow-up sent", response);
      await addTrace({
        type: "notify",
        title: "SMS sent",
        detail: payload.text,
        status: "complete",
        data: result,
      });
      return result;
    }

    console.log("[fieldstack] notify (stub):", payload);
    const emailResult = await sendAgentMail(payload, "no AgentPhone SMS delivery path");
    if (emailResult?.status === "sent") {
      return emailResult;
    }

    const result: NotifyResult = {
      status: "blocked",
      channel: "stub",
      notes: emailResult
        ? emailResult.notes
        : "Outbound SMS is disabled and AgentMail is not configured. Follow-up retained in FieldStack trace.",
    };
    await addTrace({
      type: "notify",
      title: "Follow-up retained",
      detail: payload.text,
      status: "blocked",
      data: result,
    });
    return result;
  }

  const request = await fetch(cfg.notifyWebhook, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      source: "fieldstack",
      ts: new Date().toISOString(),
      from: cfg.notifyFromName,
    }),
  });

  if (!request.ok) {
    const body = await request.text();
    throw new Error(`notify webhook failed: ${request.status} ${body}`);
  }

  const result: NotifyResult = {
    status: "sent",
    channel: "webhook",
    notes: "Follow-up delivered to configured notify webhook.",
  };
  await addTrace({
    type: "notify",
    title: "Webhook follow-up sent",
    detail: payload.text,
    status: "complete",
    data: result,
  });
  return result;
};
