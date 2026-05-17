const basePayload = {
  event_type: "call.transcript",
  id: "fieldstack-demo-call-001",
  kind: "call",
  channel: "voice",
  from: {
    phone: "+14155550199",
    name: "Sarah Chen",
  },
  transcript:
    "This is Sarah from Acme. The export button is still missing on the reports dashboard. You promised this last week.",
  metadata: {
    platform: "agentphone",
    customer_name: "Acme",
    contact_name: "Sarah Chen",
    contact_role: "CTO",
    plan: "Enterprise",
    tenant: "acme-demo",
    promised_feature: "CSV export on the reports dashboard",
    promised_on: "2026-05-10",
  },
};

const url = process.env.CALLSTACK_WEBHOOK_URL || "http://127.0.0.1:8787/agentphone/events";
const send = async (label: "first" | "second") => {
  const payload = {
    ...basePayload,
    id: `${basePayload.id}-${label}`,
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[fieldstack] simulate ${label} failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  const result = json.result;
  console.log(
    `[fieldstack] ${label} response: work_order=${result.work_order}, repair=${result.repair.status}, mode=${result.repair.mode}`,
  );
  return result;
};

try {
  const first = await send("first");
  const second = await send("second");
  const duplicateMatch = first.work_order && second.work_order && first.work_order === second.work_order;
  if (duplicateMatch) {
    console.log("[fieldstack] ✅ deterministic duplicate merge confirmed (same work order reused).");
  } else {
    console.log(`[fieldstack] ⚠️ duplicate merge did not occur. first=${first.work_order} second=${second.work_order}`);
  }
  console.log("first note:", first.follow_up);
  console.log("second note:", second.follow_up);
} catch (err) {
  console.error(String(err));
  process.exit(1);
}
