// Watchdog thread for workerWatchdog.ts, see docs/stall-watchdog.md. Plain CommonJS:
// Node loads a worker_threads script itself, not through jest's transform.
const fs = require("node:fs");
const path = require("node:path");
const { Session } = require("node:inspector");
const { parentPort, workerData } = require("node:worker_threads");

const { stallMs, reportDir } = workerData;
const CHECK_MS = Math.min(5_000, Math.max(250, Math.floor(stallMs / 10)));
const PAUSE_TIMEOUT_MS = 5_000;

let lastBeatAt = Date.now();
let pollState;
parentPort.on("message", next => {
  lastBeatAt = Date.now();
  pollState = next;
});

// Same encoding as @actions/core's escapeData.
function escapeWorkflowCommandData(text) {
  return text.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

function frameLabel(frame) {
  const where = frame.filename ? `${path.basename(frame.filename)}:${frame.lineno}` : "?";
  return `${frame.function || "<anonymous>"} (${where})`;
}

function captureFrozenFrames(onFrames) {
  const timer = setTimeout(() => onFrames([]), PAUSE_TIMEOUT_MS);
  try {
    const session = new Session();
    session.connectToMainThread();
    const urls = new Map();
    session.on("Debugger.scriptParsed", ({ params }) => urls.set(params.scriptId, params.url));
    session.once("Debugger.paused", ({ params }) => {
      clearTimeout(timer);
      onFrames(
        params.callFrames.map(({ functionName, location }) => ({
          function: functionName,
          filename: urls.get(location.scriptId),
          lineno: location.lineNumber + 1,
        })),
      );
    });
    // V8 delivers the pause as an interrupt, so it lands even in a busy JS loop, never in native code.
    session.post("Debugger.enable", () => session.post("Debugger.pause"));
  } catch {
    clearTimeout(timer);
    onFrames([]);
  }
}

function reportAndKill(lastSeenMs, frames) {
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
}

const check = setInterval(() => {
  const lastSeenMs = Date.now() - lastBeatAt;
  if (lastSeenMs < stallMs) return;
  clearInterval(check);
  captureFrozenFrames(frames => reportAndKill(lastSeenMs, frames));
}, CHECK_MS);
