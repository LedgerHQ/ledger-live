// Watchdog thread for workerWatchdog.ts (QAA-1365).
//
// Plain CommonJS on purpose: a worker_threads script is loaded by Node itself, not
// through jest's transform. It runs on its own thread and event loop, so it keeps
// working while the jest worker's main thread is frozen.
const fs = require("node:fs");
const path = require("node:path");
const { workerData } = require("node:worker_threads");
const { captureStackTrace, getThreadsLastSeen } = require("@sentry/node-native-stacktrace");

const { stallMs, threadName, reportDir } = workerData;
const CHECK_MS = Math.min(5_000, Math.max(250, Math.floor(stallMs / 10)));

function frameLabel(frame) {
  const where = frame.filename ? `${path.basename(frame.filename)}:${frame.lineno}` : "?";
  return `${frame.function || "<anonymous>"} (${where})`;
}

const check = setInterval(() => {
  const lastSeenMs = getThreadsLastSeen()[threadName];
  if (lastSeenMs === undefined || lastSeenMs < stallMs) return;
  clearInterval(check);

  // Returns the frozen frames when the thread is stuck in JS. When it is blocked
  // inside native code (a syscall, execSync) it gives up after a bounded ~5s and
  // returns none, and the spec/phase from the last beat is all there is to go on.
  let frames = [];
  let pollState;
  try {
    const thread = captureStackTrace()[threadName];
    frames = thread?.frames ?? [];
    pollState = thread?.pollState;
  } catch {
    // the kill below must happen regardless
  }

  const spec = pollState?.spec ?? "<unknown spec>";
  const phase = pollState?.phase ?? "<unknown phase>";
  const stack = frames.slice(0, 10).map(frameLabel);
  const report = {
    at: new Date().toISOString(),
    pid: process.pid,
    spec,
    phase,
    reason: "event loop frozen",
    staleSeconds: Math.round(lastSeenMs / 1000),
    stack,
  };

  // One file per stalled worker, and only when one stalled: its presence in the
  // shard's artifacts means a stall happened even if Detox's retry turned the
  // shard green afterwards.
  try {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, `stall-watchdog-${process.pid}.json`),
      JSON.stringify(report, null, 2),
    );
  } catch {
    // ignore
  }

  // Straight to fd 2: this thread's console output is relayed through the frozen
  // main thread and would never arrive.
  const where = stack.length
    ? stack.slice(0, 3).join(" <- ")
    : "no JS frames (blocked in native code)";
  try {
    fs.writeSync(
      2,
      `::error::[stall-watchdog] ${path.basename(spec)} stalled: event loop frozen for ` +
        `${report.staleSeconds}s (phase "${phase}", worker ${process.pid}) at ${where}. ` +
        `Killing this worker so jest attributes the failure and Detox retries the spec.\n`,
    );
  } catch {
    // ignore
  }

  process.kill(process.pid, "SIGKILL");
}, CHECK_MS);
