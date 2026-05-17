import { cfg } from "./config.ts";
import { AgentphoneEvent } from "./types.ts";
import { gbrainStatus, touchpoint } from "./gbrain.ts";
import { processIncomingEvent } from "./orchestrator.ts";
import { controlPlaneHtml } from "./dashboard.ts";
import { agentPhoneConversationDecision } from "./conversation.ts";
import { realtimeAgentPhoneConversationDecision } from "./realtime-conversation.ts";
import { addTrace, getTrace } from "./trace.ts";

const assetTypes: Record<string, string> = {
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const serveAsset = async (pathname: string) => {
  const name = pathname.slice("/assets/".length);
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  const file = Bun.file(`${process.cwd()}/assets/${name}`);
  if (!(await file.exists())) {
    return new Response("Not found", { status: 404 });
  }

  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return new Response(file, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": assetTypes[ext] ?? "application/octet-stream",
    },
  });
};

const dashboardHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FieldStack Console</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f6f7f9;
        color: #162033;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
      }
      header {
        position: sticky;
        top: 0;
        z-index: 20;
        border-bottom: 1px solid #d8dee8;
        background: #ffffff;
      }
      .wrap {
        width: min(1120px, calc(100vw - 32px));
        margin: 0 auto;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-height: 76px;
      }
      .brand-row {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .top-menu {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .top-menu a,
      .bottom-menu a {
        color: #334155;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }
      .top-menu a {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        padding: 0 10px;
        border-radius: 7px;
      }
      .top-menu a:hover,
      .bottom-menu a:hover {
        background: #eef2f7;
        color: #0f172a;
      }
      h1 {
        margin: 0;
        font-size: 24px;
        line-height: 1.1;
        letter-spacing: 0;
      }
      .tagline {
        margin: 6px 0 0;
        color: #526175;
        font-size: 14px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid #cfd7e3;
        background: #f7fafc;
        border-radius: 999px;
        font-size: 13px;
        white-space: nowrap;
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #94a3b8;
      }
      .dot.ok {
        background: #16a34a;
      }
      .dot.bad {
        background: #dc2626;
      }
      main {
        padding: 24px 0 88px;
      }
      .jump-target {
        scroll-margin-top: 96px;
      }
      .grid {
        display: grid;
        grid-template-columns: 340px 1fr;
        gap: 18px;
        align-items: start;
      }
      section {
        background: #ffffff;
        border: 1px solid #d8dee8;
        border-radius: 8px;
      }
      .section-label {
        margin: 0 0 12px;
        color: #64748b;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .panel {
        padding: 18px;
      }
      h2 {
        margin: 0 0 14px;
        font-size: 16px;
        letter-spacing: 0;
      }
      label {
        display: block;
        margin: 14px 0 6px;
        color: #435166;
        font-size: 13px;
        font-weight: 650;
      }
      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 7px;
        background: #ffffff;
        color: #162033;
        font: inherit;
        font-size: 14px;
      }
      input,
      select {
        min-height: 40px;
        padding: 0 10px;
      }
      textarea {
        min-height: 116px;
        padding: 10px;
        resize: vertical;
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 16px;
      }
      button {
        min-height: 40px;
        border: 1px solid #b8c3d2;
        border-radius: 7px;
        background: #f8fafc;
        color: #162033;
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      button.primary {
        border-color: #1d4ed8;
        background: #1d4ed8;
        color: #ffffff;
      }
      button:disabled {
        cursor: wait;
        opacity: 0.65;
      }
      .facts {
        display: grid;
        gap: 10px;
      }
      .fact {
        display: grid;
        gap: 3px;
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 7px;
        background: #fbfcfe;
      }
      .fact span {
        color: #64748b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .fact strong {
        overflow-wrap: anywhere;
        font-size: 14px;
      }
      pre {
        min-height: 360px;
        margin: 0;
        padding: 16px;
        border-radius: 0 0 8px 8px;
        border-top: 1px solid #d8dee8;
        background: #0f172a;
        color: #dbeafe;
        overflow: auto;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .log-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
      }
      .muted {
        color: #64748b;
        font-size: 13px;
      }
      .memory-list {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .memory-list li {
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 7px;
        background: #fbfcfe;
        color: #334155;
        font-size: 14px;
      }
      .split {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .bottom-menu {
        position: fixed;
        left: 50%;
        bottom: 14px;
        z-index: 30;
        width: min(560px, calc(100vw - 24px));
        transform: translateX(-50%);
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        padding: 6px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16);
        backdrop-filter: blur(10px);
      }
      .bottom-menu a {
        min-height: 42px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        text-align: center;
      }
      @media (max-width: 860px) {
        .grid,
        .split {
          grid-template-columns: 1fr;
        }
        .topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 16px 0;
        }
        .brand-row {
          width: 100%;
          align-items: flex-start;
          flex-direction: column;
          gap: 12px;
        }
        .top-menu {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .top-menu a {
          justify-content: center;
        }
        .actions {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap topbar">
        <div class="brand-row">
          <div>
            <h1>FieldStack Console</h1>
            <p class="tagline">Every customer gets an engineer on speed dial.</p>
          </div>
          <nav class="top-menu" aria-label="Primary">
            <a href="#setup">Setup</a>
            <a href="#test">Test</a>
            <a href="#memory">Memory</a>
            <a href="#logs">Logs</a>
          </nav>
        </div>
        <div class="status-pill" id="status"><span class="dot"></span><span>Checking server</span></div>
      </div>
    </header>

    <main class="wrap grid">
      <div class="facts">
        <section class="panel jump-target" id="setup">
          <p class="section-label">Setup</p>
          <h2>Live Setup</h2>
          <div class="facts">
            <div class="fact"><span>Phone</span><strong>+1 415 966 0622</strong></div>
            <div class="fact"><span>Webhook</span><strong id="webhookUrl">/agentphone/events</strong></div>
            <div class="fact"><span>Customer</span><strong>Acme / Sarah Chen / Enterprise</strong></div>
            <div class="fact"><span>Demo Bug</span><strong>CSV export only allows Pro</strong></div>
          </div>
        </section>

        <section class="panel jump-target" id="test">
          <p class="section-label">Test</p>
          <h2>Test Event</h2>
          <div class="split">
            <div>
              <label for="customer">Customer</label>
              <input id="customer" value="Acme" />
            </div>
            <div>
              <label for="contact">Contact</label>
              <input id="contact" value="Sarah Chen" />
            </div>
          </div>

          <label for="message">Customer message</label>
          <textarea id="message">This is Sarah from Acme. The export button is still missing on the reports dashboard. You promised this last week.</textarea>

          <label for="mode">Payload shape</label>
          <select id="mode">
            <option value="fieldstack">Full FieldStack test</option>
            <option value="agentphone">AgentPhone voice webhook</option>
          </select>

          <div class="actions">
            <button id="healthBtn">Check Health</button>
            <button id="sendBtn" class="primary">Send Test</button>
          </div>
        </section>

        <section class="panel jump-target" id="memory">
          <p class="section-label">Memory</p>
          <h2>Expected GBrain Pages</h2>
          <ul class="memory-list">
            <li><strong>customers/acme</strong><br />Plan, tenant, promise, contact, repo.</li>
            <li><strong>contacts/acme-sarah-chen</strong><br />Caller identity and escalation link.</li>
            <li><strong>work-orders/acme-bug-report...</strong><br />GStack FDE execution policy and acceptance criteria.</li>
            <li><strong>interactions/acme...</strong><br />Call transcript and normalized customer report.</li>
          </ul>
        </section>
      </div>

      <section class="jump-target" id="logs">
        <div class="log-head">
          <div>
            <h2>Result</h2>
            <div class="muted" id="lastRun">No test sent yet</div>
          </div>
          <button id="clearBtn">Clear</button>
        </div>
        <pre id="output">Open this console, send a test, then watch the work order response here.</pre>
      </section>
    </main>

    <nav class="bottom-menu" aria-label="Quick navigation">
      <a href="#setup">Setup</a>
      <a href="#test">Test</a>
      <a href="#memory">Memory</a>
      <a href="#logs">Logs</a>
    </nav>

    <script>
      const statusEl = document.querySelector('#status');
      const output = document.querySelector('#output');
      const lastRun = document.querySelector('#lastRun');
      const webhookUrl = document.querySelector('#webhookUrl');
      const buttons = Array.from(document.querySelectorAll('button'));

      webhookUrl.textContent = location.origin + '/agentphone/events';

      const setBusy = (busy) => {
        buttons.forEach((button) => {
          button.disabled = busy;
        });
      };

      const print = (label, value) => {
        const body = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        output.textContent = label + '\\n\\n' + body;
        lastRun.textContent = new Date().toLocaleTimeString();
      };

      const setStatus = (ok, text) => {
        statusEl.innerHTML = '<span class="dot ' + (ok ? 'ok' : 'bad') + '"></span><span>' + text + '</span>';
      };

      const payload = () => {
        const message = document.querySelector('#message').value.trim();
        const customer = document.querySelector('#customer').value.trim() || 'Acme';
        const contact = document.querySelector('#contact').value.trim() || 'Sarah Chen';
        const mode = document.querySelector('#mode').value;

        if (mode === 'agentphone') {
          return {
            event: 'agent.message',
            channel: 'voice',
            data: {
              from: '+14155550199',
              to: '+14159660622',
              transcript: message
            },
            metadata: {
              platform: 'agentphone',
              customer_name: customer,
              contact_name: contact,
              contact_role: 'CTO',
              plan: 'Enterprise',
              tenant: 'acme-demo',
              promised_feature: 'CSV export on the reports dashboard',
              promised_on: '2026-05-10'
            }
          };
        }

        return {
          event_type: 'call.transcript',
          id: 'fieldstack-ui-' + Date.now(),
          kind: 'call',
          channel: 'web',
          from: {
            phone: '+14155550199',
            name: contact
          },
          transcript: message,
          metadata: {
            platform: 'fieldstack-ui',
            customer_name: customer,
            contact_name: contact,
            contact_role: 'CTO',
            plan: 'Enterprise',
            tenant: 'acme-demo',
            promised_feature: 'CSV export on the reports dashboard',
            promised_on: '2026-05-10'
          }
        };
      };

      const checkHealth = async () => {
        setBusy(true);
        try {
          const response = await fetch('/health');
          const data = await response.json();
          setStatus(response.ok && data.ok, response.ok && data.ok ? 'Server ready' : 'Health failed');
          print('GET /health', data);
        } catch (error) {
          setStatus(false, 'Server unreachable');
          print('GET /health failed', String(error));
        } finally {
          setBusy(false);
        }
      };

      const sendTest = async () => {
        setBusy(true);
        const body = payload();
        try {
          const response = await fetch('/agentphone/events', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await response.json();
          print('POST /agentphone/events', data);
        } catch (error) {
          print('POST /agentphone/events failed', String(error));
        } finally {
          setBusy(false);
        }
      };

      document.querySelector('#healthBtn').addEventListener('click', checkHealth);
      document.querySelector('#sendBtn').addEventListener('click', sendTest);
      document.querySelector('#clearBtn').addEventListener('click', () => {
        output.textContent = 'Cleared.';
        lastRun.textContent = 'No test sent yet';
      });

      checkHealth();
    </script>
  </body>
</html>`;

const app = (async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (url.pathname === "/" && req.method === "GET") {
    return new Response(controlPlaneHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname.startsWith("/assets/") && req.method === "GET") {
    return serveAsset(url.pathname);
  }

  if (url.pathname === "/health" && req.method === "GET") {
    const status = await gbrainStatus();
    return Response.json({
      ok: true,
      touchpoint: touchpoint(),
      gbrain: status,
      environment: {
        repair_mode: cfg.repairMode,
        auto_repair: cfg.autoRepair,
        auto_notify: cfg.autoNotify,
        outbound_sms_enabled: cfg.outboundSmsEnabled,
        realtime_conversation: cfg.enableRealtimeConversation,
        realtime_model: cfg.realtimeModel,
        conversation_model: cfg.conversationModel,
      },
    });
  }

  if (url.pathname === "/trace" && req.method === "GET") {
    return Response.json(getTrace());
  }

  if (url.pathname === "/demo/reset-bug" && req.method === "POST") {
    const target = `${cfg.repoFallback}/index.html`;
    const file = Bun.file(target);
    if (!(await file.exists())) {
      return Response.json({ ok: false, error: `Demo app not found: ${target}` }, { status: 404 });
    }
    const fixed = 'const canExport = ["pro", "enterprise"].includes(plan);';
    const broken = 'const canExport = plan === "pro";';
    const before = await file.text();
    if (before.includes(fixed)) {
      await Bun.write(target, before.replace(fixed, broken));
    }
    await addTrace({
      type: "system",
      title: "Demo bug seeded",
      detail: "Reset CSV export gate to Pro-only so the next GStack run can fix it.",
      status: "complete",
      data: { target },
    });
    return Response.json({ ok: true, target, state: "broken" });
  }

  if (url.pathname === cfg.webhookPath && req.method === "POST") {
    let event: AgentphoneEvent;
    try {
      event = (await req.json()) as AgentphoneEvent;
    } catch (err) {
      return Response.json(
        { ok: false, error: `Invalid JSON payload: ${(err as Error).message}` },
        { status: 400 },
      );
    }

    try {
      await addTrace({
        type: "call",
        title: `Inbound webhook event: ${event.event || event.event_type || event.kind || "unknown"}`,
        detail: `${JSON.stringify({ event_type: event.event_type, event: event.event, kind: event.kind, channel: event.channel, from: event.from?.phone || event.caller?.phone || event.data?.from || "unknown" })}`,
        status: "pending",
        data: {
          event: event.event_type || event.event,
          channel: event.channel || event.kind || "voice",
          from: event.from?.phone || event.caller?.phone || event.data?.from || "unknown",
          to: event.to?.phone || event.data?.to || "unknown",
          phone_event: event.kind || event.event_type || "agent.event",
        },
      });

      if (event.event === "agent.call_ended") {
        const result = await processIncomingEvent(event);
        return Response.json({
          ok: true,
          text: result.follow_up,
          result,
        });
      }

      if (event.event === "agent.message" || event.channel === "voice" || event.channel === "sms") {
        const decision = cfg.enableRealtimeConversation
          ? await realtimeAgentPhoneConversationDecision(event)
          : agentPhoneConversationDecision(event);
        await addTrace({
          type: "voice_reply",
          title: decision.shouldProcess ? "Voice reply accepted report" : "Voice reply requested clarification",
          detail: decision.text,
          status: decision.shouldProcess ? "complete" : "pending",
          data: {
            customer: decision.customer,
            missingSlot: decision.missingSlot,
            hangup: decision.hangup,
            model: decision.model,
            modelMode: decision.modelMode,
            modelError: decision.modelError,
          },
        });

        if (decision.shouldProcess) {
          processIncomingEvent(event).catch((err) => {
            console.error("[fieldstack] background webhook processing failed", err);
          });
        }

        return Response.json({
          text: decision.text,
          shouldProcess: decision.shouldProcess,
          customer: decision.customer,
          missingSlot: decision.missingSlot,
          model: decision.model,
          modelMode: decision.modelMode,
          ...(decision.hangup ? { hangup: true, action: "hangup" } : {}),
        });
      }

      const result = await processIncomingEvent(event);
      const text = result.follow_up;

      return Response.json({ ok: true, result });
    } catch (err) {
      return Response.json(
        { ok: false, error: (err as Error).message },
        { status: 500 },
      );
    }
  }

  return new Response("Not found", { status: 404 });
}).bind(null);

Bun.serve({
  port: cfg.port,
  fetch: app,
});

console.log(`[fieldstack] listening on http://127.0.0.1:${cfg.port}`);
