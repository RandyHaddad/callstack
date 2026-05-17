import { immediateAgentPhoneReply } from "../src/conversation.ts";
import { agentPhoneConversationDecision } from "../src/conversation.ts";
import type { AgentphoneEvent } from "../src/types.ts";

type SmokeCase = {
  name: string;
  event: AgentphoneEvent;
  assert: (reply: string) => void;
  assertDecision?: (decision: ReturnType<typeof agentPhoneConversationDecision>) => void;
};

const acmeFdeLine = "+1 (415) 966-0622";

const assertIncludes = (reply: string, expected: string) => {
  if (!reply.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`Expected reply to include "${expected}", got: ${reply}`);
  }
};

const assertExcludes = (reply: string, forbidden: string) => {
  if (reply.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Expected reply not to include "${forbidden}", got: ${reply}`);
  }
};

const voiceEvent = (overrides: Partial<AgentphoneEvent>): AgentphoneEvent => ({
  event_type: "call.transcript",
  kind: "call",
  channel: "voice",
  ...overrides,
});

const cases: SmokeCase[] = [
  {
    name: "Acme FDE line plus export issue does not ask for customer",
    event: voiceEvent({
      data: {
        to: acmeFdeLine,
        transcript: "The export is still broken on the reports dashboard.",
      },
    }),
    assert: (reply) => {
      assertIncludes(reply, "Acme");
      assertIncludes(reply, "GStack work order");
      assertExcludes(reply, "Which customer");
      assertIncludes(reply, "text back");
    },
  },
  {
    name: "Acme FDE line plus vague button issue assumes Acme",
    event: voiceEvent({
      data: {
        to: acmeFdeLine,
        transcript: "The button is not working.",
      },
    }),
    assert: (reply) => {
      assertIncludes(reply, "Acme");
      assertExcludes(reply, "Which customer");
    },
  },
  {
    name: "Unknown caller plus vague issue asks for customer",
    event: voiceEvent({
      from: {
        phone: "+1 (212) 555-0199",
      },
      transcript: "The button is not working.",
    }),
    assert: (reply) => {
      assertIncludes(reply, "Which customer account");
    },
  },
  {
    name: "Acme identity plus vague no issue asks for behavior",
    event: voiceEvent({
      transcript: "This is Sarah from Acme.",
    }),
    assert: (reply) => {
      assertIncludes(reply, "I have Acme");
      assertIncludes(reply, "What exact product behavior should I reproduce");
      assertExcludes(reply, "CSV export promise");
    },
  },
  {
    name: "Goodbye on Acme line closes call and keeps follow-up",
    event: voiceEvent({
      data: {
        to: acmeFdeLine,
        transcript: "Thanks, goodbye.",
      },
      recentHistory: [{ content: "Sarah from Acme reported the CSV export button is missing." }],
    }),
    assert: (reply) => {
      assertIncludes(reply, "I have the Acme report");
      assertIncludes(reply, "Goodbye");
      assertIncludes(reply, "text back");
    },
    assertDecision: (decision) => {
      if (!decision.hangup || !decision.shouldProcess) {
        throw new Error(`Expected hangup and processing, got: ${JSON.stringify(decision)}`);
      }
    },
  },
  {
    name: "Fresh goodbye closes call without creating work",
    event: voiceEvent({
      data: {
        to: acmeFdeLine,
        transcript: "Thanks, goodbye.",
      },
    }),
    assert: (reply) => {
      assertIncludes(reply, "close the call");
    },
    assertDecision: (decision) => {
      if (!decision.hangup || decision.shouldProcess) {
        throw new Error(`Expected hangup without processing, got: ${JSON.stringify(decision)}`);
      }
    },
  },
];

let failed = 0;

for (const smokeCase of cases) {
  try {
    const decision = agentPhoneConversationDecision(smokeCase.event);
    const reply = immediateAgentPhoneReply(smokeCase.event);
    smokeCase.assert(reply);
    smokeCase.assertDecision?.(decision);
    console.log(`PASS ${smokeCase.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${smokeCase.name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (failed > 0) {
  process.exit(1);
}
