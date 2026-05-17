import { mkdir } from "node:fs/promises";

export type TraceEvent = {
  id: string;
  ts: string;
  type: "call" | "voice_reply" | "gbrain" | "gstack" | "notify" | "approval" | "system";
  title: string;
  detail: string;
  status: "pending" | "complete" | "blocked" | "failed";
  intelligence?: {
    summary: string;
    confidence_score: number;
    confidence_label: "high" | "medium" | "low";
    signals: string[];
  };
  data?: unknown;
};

const traceEvents: TraceEvent[] = [];
const traceDir = `${process.cwd()}/.fieldstack`;
const tracePath = `${traceDir}/trace-log.jsonl`;

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;

export const addTrace = async (event: Omit<TraceEvent, "id" | "ts">): Promise<TraceEvent> => {
  const fullEvent = {
    id: makeId(),
    ts: new Date().toISOString(),
    ...event,
  };
  traceEvents.unshift(fullEvent);
  traceEvents.splice(80);

  await mkdir(traceDir, { recursive: true });
  await Bun.write(tracePath, `${JSON.stringify(fullEvent)}\n`, { createPath: true, append: true });

  return fullEvent;
};

export const getTrace = () => ({
  events: traceEvents,
  trace_path: tracePath,
  gbrain_insight: traceEvents.find((event) => event.type === "gbrain" && event.intelligence)?.intelligence ?? null,
});
