import * as fs from "node:fs";
import * as path from "node:path";
import { performance, type EventLoopUtilization } from "node:perf_hooks";

// Probe only, never merged (QAA-1365 perf A/B): one JSON line per spec file with its wall
// time, event-loop utilisation and CPU time, to compare the stall watchdog on, off and at a
// 10ms heartbeat.

type PerfStart = { elu: EventLoopUtilization; cpu: NodeJS.CpuUsage; t: number };

export function startPerfProbe(): PerfStart {
  return { elu: performance.eventLoopUtilization(), cpu: process.cpuUsage(), t: performance.now() };
}

export function recordPerfProbe(start: PerfStart | undefined, spec: string): void {
  if (!start) return;
  const cpu = process.cpuUsage(start.cpu);
  const record = {
    arm: process.env.E2E_PERF_ARM ?? "unset",
    attempt: process.env.E2E_RETRY_TEST_NAMES ? "retry" : "first",
    configuration: process.env.DETOX_CONFIGURATION ?? "",
    spec,
    pid: process.pid,
    worker: process.env.JEST_WORKER_ID ?? "",
    wallMs: Math.round(performance.now() - start.t),
    elu: performance.eventLoopUtilization(start.elu).utilization,
    cpuMs: Math.round((cpu.user + cpu.system) / 1000),
  };
  try {
    const dir = path.join(__dirname, "..", "artifacts");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, `perf-${process.pid}.jsonl`), `${JSON.stringify(record)}\n`);
  } catch {
    // probe only: never fail a spec over it
  }
}
