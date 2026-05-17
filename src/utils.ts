import { randomUUID } from "node:crypto";

export const nowIso = () => new Date().toISOString();

export const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "item";
};

export const shortId = (length = 6) => randomUUID().replace(/-/g, "").slice(0, length);

export const runCommand = async (command: string, args: string[] = [], options: {
  cwd?: string;
  input?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
} = {}) => {
  const proc = Bun.spawn({
    cmd: [command, ...args],
    cwd: options.cwd,
    stdin: options.input ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });

  if (options.input && proc.stdin) {
    proc.stdin.write(options.input);
    proc.stdin.end();
  }

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const wait = proc.exited.then(() => proc.exitCode);
  const timeout = options.timeoutMs;
  const code = timeout
    ? await Promise.race([
        wait,
        sleep(timeout).then(() => {
          proc.kill();
          return 143;
        }),
      ])
    : await wait;

  return {
    code,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    command: `${command} ${args.join(" ")}`,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
