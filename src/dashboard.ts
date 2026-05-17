export const controlPlaneHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FieldStack Control Plane</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #181818;
        color: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        background: #181818;
        color: #ffffff;
      }
      h1, h2, h3, p { margin: 0; }
      button, input, textarea, select { font: inherit; }
      .app-shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr auto;
      }
      .topbar {
        min-height: 74px;
        display: grid;
        grid-template-columns: minmax(220px, 1fr) minmax(320px, 520px) minmax(180px, auto);
        align-items: center;
        gap: 16px;
        padding: 12px 24px;
        border-bottom: 1px solid #303030;
        background: rgba(24, 24, 24, 0.98);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .brand-mark {
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        border: 1px solid #da291c;
        background: #da291c;
      }
      .brand-mark img,
      .client-logo img {
        display: block;
        width: 100%;
        height: 100%;
      }
      .brand-mark svg,
      .logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .logo {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border: 1px solid #303030;
        background: #181818;
      }
      .logo.red {
        border-color: #da291c;
        background: #da291c;
      }
      .logo.green {
        border-color: #03904a;
        background: #03904a;
      }
      .client-logo {
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        border: 1px solid #303030;
        background: #181818;
      }
      .brand h1 {
        font-size: 22px;
        line-height: 1.05;
        letter-spacing: 0;
      }
      .muted {
        color: #969696;
        font-size: 13px;
        line-height: 1.4;
      }
      .client-bar {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .client-chip {
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid #303030;
        background: #181818;
      }
      .client-copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }
      .client-chip span,
      .eyebrow {
        color: #969696;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .client-chip strong {
        overflow-wrap: anywhere;
        font-size: 14px;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .title-row .eyebrow {
        margin-bottom: 0;
      }
      .user-box {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .status {
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
        border: 1px solid #303030;
        background: #303030;
        color: #ffffff;
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #666666;
      }
      .dot.ok { background: #03904a; }
      .dot.bad { background: #da291c; }
      .avatar {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border: 1px solid #ffffff;
        background: #303030;
        font-size: 13px;
        font-weight: 900;
      }
      main {
        min-height: 0;
        padding: 18px 24px 92px;
      }
      .screen {
        display: none;
        height: 100%;
      }
      .screen.active {
        display: grid;
      }
      .screen-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 14px;
        align-items: start;
      }
      .screen-single {
        display: grid;
        gap: 14px;
        align-content: start;
      }
      .panel {
        border: 1px solid #303030;
        background: #303030;
      }
      .panel-pad { padding: 18px; }
      .hero-card h2 {
        max-width: 880px;
        margin-top: 10px;
        font-size: 34px;
        line-height: 1.08;
        letter-spacing: 0;
      }
      .hero-card p {
        max-width: 760px;
        margin-top: 12px;
        color: #969696;
        font-size: 15px;
        line-height: 1.55;
      }
      .asset-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 18px;
      }
      .asset-tile {
        min-height: 92px;
        display: grid;
        align-content: space-between;
        gap: 10px;
        padding: 12px;
        border: 1px solid #303030;
        background: #181818;
      }
      .asset-tile strong {
        font-size: 14px;
        line-height: 1.3;
      }
      .asset-tile span {
        color: #969696;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .fde-map {
        display: grid;
        gap: 8px;
      }
      .map-node {
        position: relative;
        min-height: 74px;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #303030;
        background: #181818;
      }
      .map-node:before {
        content: "";
        width: 3px;
        height: 100%;
        position: absolute;
        left: -1px;
        top: 0;
        background: #da291c;
      }
      .map-node.complete:before {
        background: #03904a;
      }
      .map-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 1px solid #303030;
        color: #ffffff;
        font-size: 13px;
        font-weight: 950;
      }
      .map-copy strong {
        display: block;
        font-size: 15px;
      }
      .map-copy small {
        display: block;
        margin-top: 3px;
        color: #969696;
        font-size: 12px;
        line-height: 1.35;
      }
      .map-chip {
        color: #ffffff;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .metric, .row-card, .stage-card {
        border: 1px solid #303030;
        background: #181818;
      }
      .metric {
        min-height: 86px;
        display: grid;
        align-content: space-between;
        gap: 12px;
        padding: 12px;
      }
      .metric span,
      .row-card span,
      .stage-card span {
        color: #969696;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .metric strong {
        font-size: 18px;
        overflow-wrap: anywhere;
      }
      .list {
        display: grid;
        gap: 8px;
      }
      .row-card {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 12px;
        padding: 12px;
      }
      .row-card strong {
        font-size: 14px;
        line-height: 1.4;
      }
      .callout {
        padding: 14px;
        border: 1px solid #da291c;
        background: #181818;
        color: #ffffff;
        font-size: 14px;
        line-height: 1.45;
      }
      .stage-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .stage-card {
        min-height: 96px;
        display: grid;
        align-content: space-between;
        gap: 12px;
        padding: 12px;
      }
      .stage-card.active { border-color: #da291c; }
      .stage-card.complete { border-color: #03904a; }
      .stage-card strong {
        font-size: 14px;
        line-height: 1.35;
      }
      .pipeline {
        display: grid;
        gap: 8px;
      }
      .task-queue {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }
      .task-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: start;
        padding: 10px;
        border: 1px solid #303030;
        background: #181818;
      }
      .task-card strong {
        display: block;
        font-size: 14px;
      }
      .task-card small {
        display: block;
        margin-top: 3px;
        color: #969696;
        font-size: 12px;
        line-height: 1.35;
      }
      .pipeline-step {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border: 1px solid #303030;
        background: #181818;
      }
      .pipeline-step.waiting { opacity: 0.58; }
      .pipeline-step.active { border-color: #da291c; }
      .pipeline-step.complete { border-color: #03904a; }
      .step-number {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        background: #da291c;
        color: #ffffff;
        font-size: 13px;
        font-weight: 900;
      }
      .pipeline-step strong {
        display: block;
        font-size: 14px;
      }
      .pipeline-step small {
        display: block;
        margin-top: 2px;
        color: #969696;
        font-size: 12px;
      }
      .chip {
        min-height: 26px;
        display: inline-flex;
        align-items: center;
        padding: 0 9px;
        background: #303030;
        color: #ffffff;
        font-size: 12px;
        font-weight: 900;
      }
      .chip.pending { color: #969696; }
      .chip.active { background: #da291c; }
      .chip.complete { background: #03904a; }
      label {
        display: block;
        margin: 12px 0 6px;
        color: #969696;
        font-size: 13px;
        font-weight: 800;
      }
      input, textarea, select {
        width: 100%;
        border: 1px solid #303030;
        border-radius: 0;
        background: #181818;
        color: #ffffff;
        font: inherit;
        font-size: 14px;
      }
      input, select {
        min-height: 42px;
        padding: 0 10px;
      }
      textarea {
        min-height: 132px;
        padding: 10px;
        resize: vertical;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      button {
        min-height: 42px;
        border: 1px solid #ffffff;
        border-radius: 0;
        background: transparent;
        color: #ffffff;
        font: inherit;
        font-size: 14px;
        font-weight: 850;
        cursor: pointer;
      }
      button.primary {
        border-color: #da291c;
        background: #da291c;
      }
      button.approve {
        border-color: #03904a;
        background: #03904a;
      }
      button:disabled {
        opacity: 0.65;
        cursor: wait;
      }
      pre {
        min-height: 440px;
        margin: 0;
        padding: 16px;
        overflow: auto;
        background: #181818;
        color: #ffffff;
        border: 1px solid #303030;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .trace-layout {
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        gap: 14px;
      }
      .trace-board {
        display: grid;
        gap: 8px;
      }
      .trace-item {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr) 82px;
        gap: 10px;
        padding: 12px;
        border: 1px solid #303030;
        background: #181818;
      }
      .trace-item strong {
        display: block;
        font-size: 14px;
      }
      .trace-item small {
        display: block;
        margin-top: 4px;
        color: #969696;
        font-size: 12px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .trace-type,
      .trace-status {
        color: #969696;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .trace-status.complete { color: #03904a; }
      .trace-status.blocked,
      .trace-status.failed { color: #da291c; }
      .trace-summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 40;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        border-top: 1px solid #303030;
        background: rgba(24, 24, 24, 0.98);
        backdrop-filter: blur(10px);
      }
      .nav-item {
        min-height: 64px;
        display: grid;
        place-items: center;
        gap: 3px;
        border: 0;
        border-right: 1px solid #303030;
        color: #969696;
        background: transparent;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .nav-item:last-child { border-right: 0; }
      .nav-item.active {
        color: #ffffff;
        background: #303030;
      }
      .nav-item.active:before {
        content: "";
        width: 24px;
        height: 3px;
        background: #da291c;
      }
      @media (max-width: 980px) {
        .topbar {
          grid-template-columns: 1fr auto;
        }
        .client-bar {
          grid-column: 1 / -1;
          order: 3;
        }
        .screen-layout {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 640px) {
        .topbar { padding: 12px; }
        main { padding: 12px 12px 86px; }
        .client-bar,
        .metric-grid,
        .form-grid,
        .actions,
        .asset-strip,
        .trace-layout,
        .trace-summary,
        .stage-grid,
        .map-node,
        .trace-item,
        .task-card,
        .row-card {
          grid-template-columns: 1fr;
        }
        .hero-card h2 { font-size: 24px; }
        .brand h1 { font-size: 20px; }
        .nav-item { font-size: 11px; }
        .status { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark" aria-label="FieldStack logo">
            <img src="/assets/fieldstack-mark.svg" alt="" />
          </div>
          <div>
            <h1>FieldStack</h1>
            <p class="muted">AI FDE control plane</p>
          </div>
        </div>
        <div class="client-bar" aria-label="Client control plane">
          <div class="client-chip">
            <div class="client-logo" aria-hidden="true"><img src="/assets/acme-mark.svg" alt="" /></div>
            <div class="client-copy"><span>Client</span><strong>Acme Enterprise</strong></div>
          </div>
          <div class="client-chip">
            <div class="client-logo" aria-hidden="true"><img src="/assets/fde-line.svg" alt="" /></div>
            <div class="client-copy"><span>FDE Line</span><strong>+1 415 966 0622</strong></div>
          </div>
          <div class="client-chip">
            <div class="client-logo" aria-hidden="true"><img src="/assets/fieldstack-mark.svg" alt="" /></div>
            <div class="client-copy"><span>Follow-up</span><strong>harisjalal502@gmail.com</strong></div>
          </div>
        </div>
        <div class="user-box">
          <div class="status" id="status"><span class="dot"></span><span>Checking</span></div>
          <div class="avatar" aria-label="Logged in user">RH</div>
        </div>
      </header>

      <main>
        <section class="screen active" data-screen="customer">
          <div class="screen-layout">
            <div class="panel panel-pad hero-card">
              <div class="title-row">
                <div class="logo red" aria-hidden="true">
                  <svg viewBox="0 0 34 34"><path d="M8 10h18v4H8v-4zm0 6h12v4H8v-4zm0 6h18v4H8v-4z" fill="#ffffff"/></svg>
                </div>
                <p class="eyebrow">Customer Brain</p>
              </div>
              <h2>GBrain context is the product surface.</h2>
              <p>FieldStack starts from GBrain relationship memory: who called, what is already known, which tenant matters, and which engineering promises are now active work.</p>
              <div class="asset-strip" aria-label="FieldStack operating assets">
                <div class="asset-tile"><span>Identity</span><strong>Dedicated FDE line</strong></div>
                <div class="asset-tile"><span>Memory</span><strong>Acme GBrain graph</strong></div>
                <div class="asset-tile"><span>Runtime</span><strong>GStack FDE queue</strong></div>
              </div>
            </div>
            <div class="panel panel-pad">
              <p class="eyebrow">FDE Circuit</p>
              <div class="fde-map" aria-label="Customer escalation circuit">
                <div class="map-node complete">
                  <div class="map-icon">01</div>
                  <div class="map-copy"><strong>Customer calls the Acme line</strong><small>Caller ID resolves the account and contact record.</small></div>
                  <span class="map-chip">Phone</span>
                </div>
                <div class="map-node complete">
                  <div class="map-icon">02</div>
                  <div class="map-copy"><strong>GBrain recalls the account</strong><small>Plan, tenant, contacts, prior calls, open promises, and unresolved work.</small></div>
                  <span class="map-chip">Memory</span>
                </div>
                <div class="map-node">
                  <div class="map-icon">03</div>
                  <div class="map-copy"><strong>GStack receives task backlog</strong><small>Investigate, reproduce, review, QA, and hold ship for approval.</small></div>
                  <span class="map-chip">Runtime</span>
                </div>
                <div class="map-node">
                  <div class="map-icon">04</div>
                  <div class="map-copy"><strong>Customer follow-up closes the loop</strong><small>Preview and approval request are recorded back into GBrain.</small></div>
                  <span class="map-chip">Loop</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="screen" data-screen="intake">
          <div class="screen-layout">
            <div class="panel panel-pad">
              <div class="title-row">
                <div class="logo red" aria-hidden="true">
                  <svg viewBox="0 0 34 34"><path d="M10 8h14a2 2 0 012 2v9a2 2 0 01-2 2h-7l-5 5v-5h-2a2 2 0 01-2-2v-9a2 2 0 012-2z" fill="#ffffff"/></svg>
                </div>
                <p class="eyebrow">Escalation Intake</p>
              </div>
              <h2>Customer call / SMS becomes a work order.</h2>
              <div class="form-grid">
                <div>
                  <label for="customerInput">Customer</label>
                  <input id="customerInput" value="Acme" />
                </div>
                <div>
                  <label for="contactInput">Contact</label>
                  <input id="contactInput" value="Haris Jalal" />
                </div>
              </div>
              <label for="message">Escalation</label>
              <textarea id="message">This is Haris from Acme. The mobile signup page hides the continue button after I type my email.</textarea>
              <label for="mode">Intake channel</label>
              <select id="mode">
                <option value="fieldstack">Control-plane intake</option>
                <option value="agentphone">AgentPhone voice webhook</option>
              </select>
              <div class="actions">
                <button id="previewBtn">Preview Payload</button>
                <button id="runBtn" class="primary">Run AI FDE</button>
              </div>
            </div>
            <div class="panel panel-pad">
              <p class="eyebrow">Live State</p>
              <div class="stage-grid">
                <div class="stage-card waiting" data-stage="call"><span>Signal</span><strong>Waiting for customer call</strong></div>
                <div class="stage-card waiting" data-stage="memory"><span>Recall</span><strong>GBrain account match pending</strong></div>
                <div class="stage-card waiting" data-stage="work"><span>Work</span><strong>GStack work order pending</strong></div>
                <div class="stage-card waiting" data-stage="followup"><span>Loop</span><strong>Customer follow-up pending</strong></div>
              </div>
              <div class="actions">
                <button id="healthBtn">Check Health</button>
                <button id="sendBtn" class="primary">Run AI FDE</button>
              </div>
            </div>
          </div>
        </section>

        <section class="screen" data-screen="work">
          <div class="screen-layout">
            <div class="panel panel-pad hero-card">
              <div class="title-row">
                <div class="logo red" aria-hidden="true">
                  <svg viewBox="0 0 34 34"><path d="M8 9h18v4H8V9zm0 6h18v4H8v-4zm0 6h12v4H8v-4z" fill="#ffffff"/></svg>
                </div>
                <p class="eyebrow">GStack Work Order</p>
              </div>
              <h2>Account memory becomes a scoped engineering assignment.</h2>
              <p>The work order carries business context, acceptance criteria, approval policy, and the repo target.</p>
            </div>
            <div class="panel panel-pad">
              <p class="eyebrow">Current Escalation</p>
              <div class="list">
                <div class="row-card"><span>Customer</span><strong id="woCustomer">Acme</strong></div>
                <div class="row-card"><span>Issue</span><strong id="woIssue">Customer-reported product issue</strong></div>
                <div class="row-card"><span>Memory</span><strong id="woMemory">GBrain relationship memory matched</strong></div>
                <div class="row-card"><span>Root cause</span><strong id="woRoot">Waiting for investigation</strong></div>
                <div class="row-card"><span>Patch</span><strong id="woPatch">Waiting for GStack execution</strong></div>
                <div class="row-card"><span>QA proof</span><strong id="woQa">Waiting for browser proof</strong></div>
                <div class="row-card"><span>Approval</span><strong id="woApproval">Required before deploy</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section class="screen" data-screen="execution">
          <div class="screen-layout">
            <div class="panel panel-pad hero-card">
              <div class="title-row">
                <div class="logo red" aria-hidden="true">
                  <svg viewBox="0 0 34 34"><path d="M7 17l7-7 3 3-4 4 4 4-3 3-7-7zm20 0l-7 7-3-3 4-4-4-4 3-3 7 7z" fill="#ffffff"/></svg>
                </div>
                <p class="eyebrow">Execution Policy</p>
              </div>
              <h2>GStack runs like a governed FDE, not a generic agent.</h2>
              <p>Each step is explicit: recall context, reproduce, plan risk, patch, QA proof, and ship only after approval.</p>
            </div>
            <div class="panel panel-pad">
              <p class="eyebrow">GStack Runtime</p>
              <div class="pipeline">
                <div class="pipeline-step waiting" data-flow="investigate"><span class="step-number">1</span><div><strong>/investigate</strong><small>Use GBrain context and repo state</small></div><span class="chip pending">context</span></div>
                <div class="pipeline-step waiting" data-flow="browse"><span class="step-number">2</span><div><strong>/browse</strong><small>Reproduce in the customer tenant</small></div><span class="chip pending">repro</span></div>
                <div class="pipeline-step waiting" data-flow="plan"><span class="step-number">3</span><div><strong>/plan-eng-review</strong><small>Check blast radius and risk</small></div><span class="chip pending">risk</span></div>
                <div class="pipeline-step waiting" data-flow="review"><span class="step-number">4</span><div><strong>/review</strong><small>Patch with production review</small></div><span class="chip pending">patch</span></div>
                <div class="pipeline-step waiting" data-flow="qa"><span class="step-number">5</span><div><strong>/qa</strong><small>Browser proof before follow-up</small></div><span class="chip pending">proof</span></div>
                <div class="pipeline-step waiting" data-flow="ship"><span class="step-number">6</span><div><strong>/ship</strong><small>Deploy after human approval</small></div><span class="chip pending">ship</span></div>
              </div>
              <div class="task-queue" aria-label="GStack FDE task backlog">
                <div class="task-card"><div><strong>Queued from GBrain</strong><small id="queueMemory">Waiting for account memory and prior commitments.</small></div><span class="chip pending">memory</span></div>
                <div class="task-card"><div><strong>Active GStack work order</strong><small id="queueWork">No customer issue assigned yet.</small></div><span class="chip pending">task</span></div>
                <div class="task-card"><div><strong>Follow-up obligation</strong><small id="queueFollowup">Email will go to harisjalal502@gmail.com after QA.</small></div><span class="chip pending">loop</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="screen" data-screen="approval">
          <div class="screen-layout">
            <div class="panel panel-pad hero-card">
              <div class="title-row">
                <div class="logo green" aria-hidden="true">
                  <svg viewBox="0 0 34 34"><path d="M14 23L8 17l3-3 3 3 9-9 3 3-12 12z" fill="#ffffff"/></svg>
                </div>
                <p class="eyebrow">Human Approval</p>
              </div>
              <h2>The customer stays in the loop without owning the engineering workflow.</h2>
              <p>FieldStack can investigate and prepare the patch. Human approval gates deploy and customer-facing commitments.</p>
            </div>
            <div class="panel panel-pad">
              <p class="eyebrow">Deploy Gate</p>
              <div class="callout">Customer reply: APPROVE. FieldStack records approval in GBrain and unblocks /ship.</div>
              <div class="actions">
                <button class="approve" id="approveBtn">Mark Approved</button>
                <button id="clearBtn">Reset Demo</button>
              </div>
            </div>
          </div>
        </section>

        <section class="screen" data-screen="activity">
          <div class="screen-single">
            <div class="panel panel-pad hero-card">
              <div class="title-row">
                <div class="logo red" aria-hidden="true">
                  <svg viewBox="0 0 34 34"><path d="M9 8h16v3H9V8zm0 5h16v3H9v-3zm0 5h10v3H9v-3zm0 5h16v3H9v-3z" fill="#ffffff"/></svg>
                </div>
                <p class="eyebrow">Activity Log</p>
              </div>
              <h2>Readable audit trail for the AI FDE.</h2>
              <p id="lastRun">No run yet</p>
              <div class="actions">
                <button id="traceBtn" type="button">Refresh Trace</button>
                <button id="resetBugBtn" type="button">Seed Broken State</button>
              </div>
            </div>
            <div class="trace-summary">
              <div class="metric"><span>Last Call</span><strong id="traceCall">Waiting</strong></div>
              <div class="metric"><span>GBrain</span><strong id="traceBrain">No write yet</strong></div>
              <div class="metric"><span>GStack</span><strong id="traceGstack">No run yet</strong></div>
              <div class="metric"><span>Follow-up</span><strong id="traceNotify">No delivery yet</strong></div>
            </div>
            <div class="trace-layout">
              <div class="panel panel-pad">
                <p class="eyebrow">System Trace</p>
                <div class="trace-board" id="traceBoard">
                  <div class="trace-item"><span class="trace-type">Idle</span><div><strong>No events yet</strong><small>Call the FDE line or run intake.</small></div><span class="trace-status">pending</span></div>
                </div>
              </div>
              <pre id="output">Run intake or call the number to create a customer-aware GBrain work order and see the raw response here.</pre>
            </div>
          </div>
        </section>
      </main>

      <nav class="bottom-nav" aria-label="Screen navigation">
        <button class="nav-item active" data-nav="customer" type="button">Client</button>
        <button class="nav-item" data-nav="intake" type="button">Intake</button>
        <button class="nav-item" data-nav="work" type="button">Work</button>
        <button class="nav-item" data-nav="execution" type="button">Run</button>
        <button class="nav-item" data-nav="approval" type="button">Approve</button>
        <button class="nav-item" data-nav="activity" type="button">Log</button>
      </nav>
    </div>

    <script>
      const statusEl = document.querySelector('#status');
      const output = document.querySelector('#output');
      const lastRun = document.querySelector('#lastRun');
      const traceBoard = document.querySelector('#traceBoard');
      const traceSummary = {
        call: document.querySelector('#traceCall'),
        brain: document.querySelector('#traceBrain'),
        gstack: document.querySelector('#traceGstack'),
        notify: document.querySelector('#traceNotify')
      };
      const buttons = Array.from(document.querySelectorAll('button'));
      const navItems = Array.from(document.querySelectorAll('[data-nav]'));
      const screens = Array.from(document.querySelectorAll('[data-screen]'));
      const stageCards = Array.from(document.querySelectorAll('[data-stage]'));
      const flowRows = Array.from(document.querySelectorAll('[data-flow]'));
      const workFields = {
        customer: document.querySelector('#woCustomer'),
        issue: document.querySelector('#woIssue'),
        memory: document.querySelector('#woMemory'),
        root: document.querySelector('#woRoot'),
        patch: document.querySelector('#woPatch'),
        qa: document.querySelector('#woQa'),
        approval: document.querySelector('#woApproval')
      };
      const queueFields = {
        memory: document.querySelector('#queueMemory'),
        work: document.querySelector('#queueWork'),
        followup: document.querySelector('#queueFollowup')
      };

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      let tracePollId;
      let lastTraceId = '';
      const seenTraceEventIds = new Set();
      const notificationState = {
        enabled: false,
        requested: false,
        supported: typeof Notification !== 'undefined',
      };

      const setScreen = (name) => {
        screens.forEach((screen) => {
          screen.classList.toggle('active', screen.dataset.screen === name);
        });
        navItems.forEach((item) => {
          item.classList.toggle('active', item.dataset.nav === name);
        });
        history.replaceState(null, '', '#' + name);
      };

      const setBusy = (busy) => {
        buttons.forEach((button) => {
          if (!button.dataset.nav) button.disabled = busy;
        });
      };

      const setStatus = (ok, text) => {
        statusEl.innerHTML = '<span class="dot ' + (ok ? 'ok' : 'bad') + '"></span><span>' + text + '</span>';
      };

      const print = (label, value) => {
        const body = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        output.textContent = label + '\\n\\n' + body;
        lastRun.textContent = new Date().toLocaleTimeString();
        setScreen('activity');
      };

      const summarizeTrace = (events) => {
        const find = (type) => events.find((event) => event.type === type);
        const call = find('call') || find('voice_reply');
        const brain = find('gbrain');
        const gstack = find('gstack');
        const notify = find('notify');
        traceSummary.call.textContent = call ? call.title : 'Waiting';
        const intelligence = brain?.intelligence;
        if (intelligence) {
          traceSummary.brain.textContent = intelligence.summary + ' ' + intelligence.confidence_score + '% ' + intelligence.confidence_label;
          if (Array.isArray(intelligence.signals) && intelligence.signals.length) {
            queueFields.memory.textContent = 'Evidence: ' + intelligence.signals.slice(0, 2).join(' | ');
          }
        } else {
          traceSummary.brain.textContent = brain ? brain.detail : 'No write yet';
        }
        traceSummary.gstack.textContent = gstack?.data?.run_id || gstack?.title || 'No run yet';
        traceSummary.notify.textContent = notify?.data?.channel === 'agentmail_email' ? 'Email sent' : notify ? notify.title : 'No delivery yet';
        if (gstack?.data?.notes) queueFields.work.textContent = gstack.data.notes;
        if (brain?.detail && !queueFields.memory.textContent.includes('Evidence:')) queueFields.memory.textContent = brain.detail;
        if (notify?.data?.notes) queueFields.followup.textContent = notify.data.notes;
      };

      const renderTrace = (events) => {
        if (!events.length) {
          traceBoard.innerHTML = '<div class="trace-item"><span class="trace-type">Idle</span><div><strong>No events yet</strong><small>Call the FDE line or run intake.</small></div><span class="trace-status">pending</span></div>';
          summarizeTrace([]);
          return;
        }

        traceBoard.innerHTML = events.slice(0, 18).map((event) => {
          const time = new Date(event.ts).toLocaleTimeString();
          const detail = String(event.detail || '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
          return '<div class="trace-item">' +
            '<span class="trace-type">' + event.type + '<br />' + time + '</span>' +
            '<div><strong>' + event.title + '</strong><small>' + detail + '</small></div>' +
            '<span class="trace-status ' + event.status + '">' + event.status + '</span>' +
          '</div>';
        }).join('');
        summarizeTrace(events);
      };

      const refreshTrace = async () => {
        const response = await fetch('/trace');
        const data = await response.json();
        renderTrace(data.events || []);
        return data;
      };

      const refreshTraceQuiet = async () => {
        const response = await fetch('/trace');
        const data = await response.json();
        const events = data.events || [];
        if (!seenTraceEventIds.size && events.length) {
          events.forEach((event) => {
            if (event?.id) seenTraceEventIds.add(event.id);
          });
        }
        const latestId = events.length ? events[0]?.id : '';
        if (notificationState.enabled && events.length) {
          const fresh = events.filter((event) => event?.id && !seenTraceEventIds.has(event.id));
          fresh.forEach((event) => {
            if (event.type === 'call' || event.type === 'voice_reply') {
              new Notification('FieldStack: new call signal', {
                body: event.title + '\\n' + String(event.detail || '').slice(0, 120),
              });
            }
            seenTraceEventIds.add(event.id);
          });
        }
        if (latestId && latestId !== lastTraceId) {
          renderTrace(events);
          lastTraceId = latestId;
        }
        return data;
      };

      const startTraceStream = () => {
        if (tracePollId) return;
        tracePollId = setInterval(() => {
          refreshTraceQuiet().catch(() => {});
        }, 1200);
      };

      const appendLog = (line) => {
        const blank = output.textContent === 'Run intake to create a customer-aware GBrain work order and see the response here.' || output.textContent === 'Cleared.';
        output.textContent = (blank ? '' : output.textContent + '\\n') + line;
        lastRun.textContent = new Date().toLocaleTimeString();
      };

      const resetDemoState = () => {
        stageCards.forEach((card) => { card.className = 'stage-card waiting'; });
        stageCards.find((card) => card.dataset.stage === 'call').querySelector('strong').textContent = 'Waiting for customer call';
        stageCards.find((card) => card.dataset.stage === 'memory').querySelector('strong').textContent = 'GBrain account match pending';
        stageCards.find((card) => card.dataset.stage === 'work').querySelector('strong').textContent = 'GStack work order pending';
        stageCards.find((card) => card.dataset.stage === 'followup').querySelector('strong').textContent = 'Customer follow-up pending';
        flowRows.forEach((row) => {
          row.className = 'pipeline-step waiting';
          row.querySelector('.chip').className = 'chip pending';
        });
        workFields.customer.textContent = 'Acme';
        workFields.issue.textContent = 'Customer-reported product issue';
        workFields.memory.textContent = 'GBrain relationship memory matched';
        workFields.root.textContent = 'Waiting for investigation';
        workFields.patch.textContent = 'Waiting for GStack execution';
        workFields.qa.textContent = 'Waiting for browser proof';
        workFields.approval.textContent = 'Required before deploy';
        queueFields.memory.textContent = 'Waiting for account memory and prior commitments.';
        queueFields.work.textContent = 'No customer issue assigned yet.';
        queueFields.followup.textContent = 'Email will go to harisjalal502@gmail.com after QA.';
        output.textContent = '';
      };

      const setStage = (stage, state, text) => {
        const card = stageCards.find((item) => item.dataset.stage === stage);
        if (!card) return;
        card.className = 'stage-card ' + state;
        card.querySelector('strong').textContent = text;
      };

      const setFlow = (flow, state) => {
        const row = flowRows.find((item) => item.dataset.flow === flow);
        if (!row) return;
        row.className = 'pipeline-step ' + state;
        row.querySelector('.chip').className = 'chip ' + state;
      };

      const buildPayload = () => {
        const message = document.querySelector('#message').value.trim();
        const customer = document.querySelector('#customerInput').value.trim() || 'Acme';
        const contact = document.querySelector('#contactInput').value.trim() || 'Haris Jalal';
        const mode = document.querySelector('#mode').value;
        const metadata = {
          platform: mode === 'agentphone' ? 'agentphone' : 'fieldstack-ui',
          customer_name: customer,
          contact_name: contact,
          contact_role: 'CTO',
          plan: 'Enterprise',
          tenant: 'acme-demo',
          promised_feature: 'implementation commitment tracked in GBrain',
          promised_on: 'GBrain customer timeline',
          customer_email: 'harisjalal502@gmail.com',
          business_context: 'Enterprise customer account with a dedicated AI FDE line. Use GBrain memory plus the live report to decide the GStack task backlog.'
        };
        if (mode === 'agentphone') {
          return {
            event: 'agent.message',
            channel: 'voice',
            data: { from: '+14155550199', to: '+14159660622', transcript: message },
            metadata
          };
        }
        return {
          event_type: 'call.transcript',
          id: 'fieldstack-ui-' + Date.now(),
          kind: 'call',
          channel: 'web',
          from: { phone: '+14155550199', name: contact },
          transcript: message,
          metadata
        };
      };

      const runVisualSequence = async () => {
        resetDemoState();
        setScreen('intake');
        const issueText = document.querySelector('#message').value.trim();
        const contact = document.querySelector('#contactInput').value.trim() || 'Haris Jalal';
        appendLog('00:00 inbound: ' + contact + ' reached the Acme FDE line.');
        setStage('call', 'active', contact + ' is reporting a product issue');
        await sleep(450);
        setStage('call', 'complete', 'Customer escalation captured');
        setStage('memory', 'active', 'Looking up Acme in GBrain');
        setFlow('investigate', 'active');
        appendLog('00:01 gbrain: matched Acme account, tenant, contact, and prior work.');
        await sleep(550);
        setStage('memory', 'complete', 'Acme memory recalled');
        workFields.memory.textContent = 'GBrain account memory linked to this escalation';
        queueFields.memory.textContent = 'Acme customer graph attached to live call';
        setFlow('investigate', 'complete');
        setFlow('browse', 'active');
        setScreen('execution');
        appendLog('00:02 gstack: created task from caller report: ' + issueText);
        queueFields.work.textContent = issueText;
        await sleep(550);
        setStage('work', 'active', 'Creating GStack work order');
        setFlow('browse', 'complete');
        setFlow('plan', 'active');
        workFields.root.textContent = 'GStack investigation scoped from GBrain + caller report';
        setScreen('work');
        appendLog('00:03 queue: /investigate, /plan-eng-review, /review, /qa, /ship now visible.');
        await sleep(550);
        setFlow('plan', 'complete');
        setFlow('review', 'active');
        workFields.patch.textContent = 'GStack will prepare smallest safe patch or approval-gated handoff';
        appendLog('00:04 review: production-risk and customer-commitment checks attached.');
        await sleep(550);
        setFlow('review', 'complete');
        setFlow('qa', 'active');
        workFields.qa.textContent = 'QA proof follows the work order acceptance criteria';
        setScreen('execution');
        appendLog('00:05 qa: customer path checked against acceptance criteria.');
        await sleep(550);
        setFlow('qa', 'complete');
        setStage('work', 'complete', 'Work order prepared with QA proof');
        setStage('followup', 'active', 'Drafting customer follow-up');
        queueFields.followup.textContent = 'Follow-up email queued to harisjalal502@gmail.com';
        await sleep(350);
      };

      const finishVisualSequence = (data) => {
        const workOrder = data?.result?.work_order || data?.result?.issue || 'work-order pending';
        const followUp = data?.result?.follow_up || data?.text || 'Follow-up drafted.';
        const repair = data?.result?.repair;
        if (repair?.gstack_steps?.length) {
          repair.gstack_steps.forEach((step) => {
            const key = step.skill.replace('/', '').replace('plan-eng-review', 'plan');
            if (key === 'ship' && step.status === 'skipped') {
              setFlow('ship', 'active');
            } else {
              setFlow(key, step.status === 'complete' ? 'complete' : 'active');
            }
          });
          workFields.root.textContent = repair.gstack_steps.find((step) => step.skill === '/investigate')?.summary || workFields.root.textContent;
          workFields.patch.textContent = repair.notes || workFields.patch.textContent;
          workFields.qa.textContent = repair.qa_result || workFields.qa.textContent;
          workFields.approval.textContent = 'GStack /ship gated on APPROVE';
          queueFields.work.textContent = repair.notes || queueFields.work.textContent;
        }
        setStage('followup', 'complete', 'Customer follow-up ready');
        setFlow('ship', 'active');
        if (!repair?.gstack_steps?.length) workFields.approval.textContent = 'Waiting for customer to reply APPROVE';
        appendLog('00:06 gbrain: wrote ' + workOrder);
        appendLog('00:07 follow-up: ' + followUp);
        if (data?.result?.notify?.status) {
          appendLog('00:08 notify: ' + data.result.notify.status + ' — ' + data.result.notify.notes);
          queueFields.followup.textContent = data.result.notify.notes;
        }
        appendLog('\\nAPI response:\\n' + JSON.stringify(data, null, 2));
        refreshTrace().catch(() => {});
        setScreen('activity');
      };

      const checkHealth = async () => {
        setBusy(true);
        try {
          const response = await fetch('/health');
          const data = await response.json();
          setStatus(response.ok && data.ok, response.ok && data.ok ? 'Ready' : 'Health failed');
          print('GET /health', data);
        } catch (error) {
          setStatus(false, 'Offline');
          print('GET /health failed', String(error));
        } finally {
          setBusy(false);
        }
      };

      const runIntake = async () => {
        setBusy(true);
        if (notificationState.supported && !notificationState.requested) {
          notificationState.requested = true;
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            notificationState.enabled = permission === 'granted';
          } else {
            notificationState.enabled = Notification.permission === 'granted';
          }
          if (!notificationState.enabled && Notification.permission === 'denied') {
            print('Browser notifications disabled. Enable permission to get popup call alerts.');
          }
        } else if (notificationState.supported && Notification.permission === 'granted') {
          notificationState.enabled = true;
        }
        await runVisualSequence();
        try {
          const response = await fetch('/agentphone/events', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(buildPayload())
          });
          finishVisualSequence(await response.json());
        } catch (error) {
          setStage('followup', 'waiting', 'Follow-up blocked');
          print('POST /agentphone/events failed', String(error));
        } finally {
          setBusy(false);
        }
      };

      navItems.forEach((item) => {
        item.addEventListener('click', () => setScreen(item.dataset.nav));
      });
      document.querySelector('#healthBtn').addEventListener('click', checkHealth);
      document.querySelector('#sendBtn').addEventListener('click', runIntake);
      document.querySelector('#runBtn').addEventListener('click', runIntake);
      document.querySelector('#previewBtn').addEventListener('click', () => print('Preview payload', buildPayload()));
      document.querySelector('#traceBtn').addEventListener('click', () => {
        refreshTrace().then((data) => print('GET /trace', data)).catch((error) => print('GET /trace failed', String(error)));
      });
      document.querySelector('#resetBugBtn').addEventListener('click', async () => {
        setBusy(true);
        try {
          const response = await fetch('/demo/reset-bug', { method: 'POST' });
          const data = await response.json();
          await refreshTrace();
          print('POST /demo/reset-bug', data);
        } catch (error) {
          print('POST /demo/reset-bug failed', String(error));
        } finally {
          setBusy(false);
        }
      });
      document.querySelector('#clearBtn').addEventListener('click', () => {
        resetDemoState();
        output.textContent = 'Cleared.';
        lastRun.textContent = 'No run yet';
      });
      document.querySelector('#approveBtn').addEventListener('click', () => {
        setFlow('ship', 'complete');
        workFields.approval.textContent = 'Approved by customer; /ship unblocked';
        setStage('followup', 'complete', 'Approval captured');
        print('APPROVE', {
          customer: 'Acme',
          work_order: 'latest Acme GBrain work order',
          action: 'approval recorded',
          next: 'FieldStack would update GBrain status and unblock /ship.'
        });
      });

      const initialScreen = location.hash.replace('#', '') || 'customer';
      setScreen(['customer', 'intake', 'work', 'execution', 'approval', 'activity'].includes(initialScreen) ? initialScreen : 'customer');
      checkHealth();
      refreshTrace().catch(() => {});
      refreshTraceQuiet().then((data) => {
        const initial = data?.events || [];
        lastTraceId = initial.length ? initial[0]?.id : '';
      }).catch(() => {});
      startTraceStream();
    </script>
  </body>
</html>`;
