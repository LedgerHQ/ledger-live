// Watchdog thread for workerWatchdog.ts, see docs/stall-watchdog.md. Plain CommonJS:
// Node loads a worker_threads script itself, not through jest's transform.
const fs = require("node:fs");
const path = require("node:path");
const { workerData } = require("node:worker_threads");
const { captureStackTrace, getThreadsLastSeen } = require("@sentry/node-native-stacktrace");

const { stallMs, threadName, reportDir } = workerData;
const CHECK_MS = Math.min(5_000, Math.max(250, Math.floor(stallMs / 10)));

// Same encoding as @actions/core's escapeData.
function escapeWorkflowCommandData(text) {
  return text.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

function frameLabel(frame) {
  const where = frame.filename ? `${path.basename(frame.filename)}:${frame.lineno}` : "?";
  return `${frame.function || "<anonymous>"} (${where})`;
}

const check = setInterval(() => {
  const lastSeenMs = getThreadsLastSeen()[threadName];
  if (lastSeenMs === undefined || lastSeenMs < stallMs) return;
  clearInterval(check);

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

  try {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, `stall-watchdog-${process.pid}.json`),
      JSON.stringify(report, null, 2),
    );
  } catch {
    // ignore
  }

  const where = stack.length
    ? stack.slice(0, 3).join(" <- ")
    : "no JS frames (blocked in native code)";
  const annotation =
    `[stall-watchdog] ${path.basename(spec)} stalled: event loop frozen for ` +
    `${report.staleSeconds}s (phase "${phase}", worker ${process.pid}) at ${where}. ` +
    `Killing this worker so jest attributes the failure and Detox retries the spec.`;
  try {
    // Not console: a thread's console is relayed through the frozen main thread.
    fs.writeSync(2, `::error::${escapeWorkflowCommandData(annotation)}\n`);
  } catch {
    // ignore
  }

  process.kill(process.pid, "SIGKILL");
}, CHECK_MS);
