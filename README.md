# FieldStack MVP

**Every customer gets an engineer on speed dial.**

FieldStack deploys a GStack/GBrain-powered AI FDE to a customer account. A customer can call or text an escalation, FieldStack resolves their identity into GBrain customer memory, creates a GStack work order, runs an investigation/repair policy, and sends the customer a follow-up.

The hackathon demo proves one tight loop:

```text
Sarah from Acme calls
-> FieldStack finds Acme customer memory
-> creates a GBrain work order
-> runs a GStack-style repair
-> fixes the Enterprise export bug
-> sends a customer-facing follow-up
```

## Demo Story

Acme is an Enterprise customer. GBrain memory says CSV export was promised during onboarding on `2026-05-10`.

The seeded app bug is:

```js
const canExport = plan === "pro";
```

Acme is `enterprise`, so the export button is missing. The repair script changes it to:

```js
const canExport = ["pro", "enterprise"].includes(plan);
```

## Quick Start

```bash
cd /Users/randyhaddad/Desktop/GBrain Hackathon/callstack
cp .env.example .env
npx --yes bun run src/server.ts
```

In another terminal, send the Acme call:

```bash
cd /Users/randyhaddad/Desktop/GBrain Hackathon/callstack
npx --yes bun run scripts/simulate.ts
```

## Endpoints

- `GET /health` checks runtime and GBrain readiness.
- `GET /trace` returns the latest call, GBrain, GStack, and notification trace.
- `POST /demo/reset-bug` reseeds the demo app bug for another live run.
- `POST /agentphone/events` accepts AgentPhone-style call/SMS payloads.

## Environment

All settings use `.env`:

- `GBRAIN_BINARY`: path or command for the GBrain CLI.
- `CALLSTACK_REPAIR_MODE`: `noop`, `gstack`, `script`, or `codex`.
- `CALLSTACK_AUTO_REPAIR=1`: immediately run the FDE repair policy.
- `GSTACK_HOME`: local gstack checkout used by the `gstack` repair mode.
- `CALLSTACK_REPAIR_SCRIPT`: command used in script mode.
- `CALLSTACK_NOTIFY_WEBHOOK`: optional AgentPhone/SMS callback endpoint.
- `CALLSTACK_OUTBOUND_SMS_ENABLED=1`: attempt real AgentPhone outbound SMS. Keep `0` until 10DLC/outbound SMS is enabled; FieldStack will retain the follow-up in the trace instead.
- `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID`: optional AgentMail fallback. When AgentPhone SMS is blocked, FieldStack sends the follow-up email through `POST /v0/inboxes/:inbox_id/messages/send`.
- `CALLSTACK_CUSTOMER_EMAIL`: fallback customer email for the demo, used when the inbound event does not include `metadata.customer_email`.
- `OPENAI_API_KEY`: used for optional issue extraction and model-phrased phone replies.
- `CALLSTACK_ENABLE_REALTIME_CONVERSATION=1`: model-phrase live AgentPhone webhook replies while deterministic slot logic controls actions.
- `CALLSTACK_REALTIME_MODEL`: first model to try. Defaults to `gpt-realtime`, which is intended for OpenAI Realtime API sessions over WebRTC/WebSocket/SIP.
- `CALLSTACK_CONVERSATION_MODEL`: webhook text fallback for AgentPhone-transcribed calls. Defaults to `gpt-4o-mini`, and the trace records whether this or the deterministic fallback answered.

The env variable prefix is still `CALLSTACK_` for compatibility with the first scaffold. The product/demo is now FieldStack.

## What Gets Written To GBrain

Each customer escalation writes:

- `customers/acme`
- `contacts/acme-sarah-chen`
- `interactions/acme-...`
- `work-orders/acme-bug-report-...`
- `projects/...`

The work order includes customer plan, tenant, promised feature, business context, acceptance criteria, and the GStack execution flow:

```text
/investigate
/browse
/plan-eng-review
/review
/qa
/ship
```

## GStack Repair Demo

This is the main hackathon path. It loads local GStack skill definitions, creates a visible GStack run artifact, applies the Acme export fix, and gates `/ship` on approval.

```bash
CALLSTACK_REPAIR_MODE=gstack \
CALLSTACK_AUTO_REPAIR=1 \
GSTACK_HOME="/Users/randyhaddad/Desktop/GBrain Hackathon/gstack" \
npx --yes bun run src/server.ts
```

Then run:

```bash
npx --yes bun run scripts/simulate.ts
```

Expected result:

```text
GStack run: acme-export-...
/investigate complete
/plan-eng-review complete
/review complete
/qa complete
/ship skipped until APPROVE
```

Run artifacts are written to `.fieldstack/gstack-runs/*.md`.

To replay the live demo from the broken state:

```bash
bun run demo:reset-bug
```

## Script Repair Demo

To run the local repair mode:

```bash
CALLSTACK_REPAIR_MODE=script \
CALLSTACK_AUTO_REPAIR=1 \
CALLSTACK_REPAIR_SCRIPT="/bin/bash '/Users/randyhaddad/Desktop/GBrain Hackathon/callstack/scripts/fix-demo-bug.sh' '/Users/randyhaddad/Desktop/GBrain Hackathon/callstack/demo-app/index.html'" \
npx --yes bun run src/server.ts
```

Then run:

```bash
npx --yes bun run scripts/simulate.ts
```

Expected follow-up:

```text
Found it. Acme was on Enterprise, but the entitlement path did not allow the promised feature...
Reply APPROVE to deploy.
```

## Real Phone Flow

1. Expose this server publicly.
2. Point AgentPhone inbound events at `https://YOUR_HOST/agentphone/events`.
3. Set `CALLSTACK_NOTIFY_WEBHOOK` to your outbound SMS/callback endpoint.
4. Keep `CALLSTACK_ENABLE_LLM_EXTRACTION=0` for the deterministic demo, or enable it with `OPENAI_API_KEY` for richer parsing.

## Pitch

FieldStack deploys a GStack/GBrain-powered AI FDE to every customer. When a customer calls, the agent knows their company, implementation history, promises, open issues, and product configuration through GBrain. It then uses GStack skills to investigate, reproduce, patch, QA, open a PR, and follow up.

Customer support used to create tickets. FieldStack creates tested engineering work.
