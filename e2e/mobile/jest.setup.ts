import "tsconfig-paths/register";
import fs from "fs";
import path from "path";

// Suppress Polkadot 'has multiple versions' warnings from all console methods and stdout/stderr
const methods: (keyof Console)[] = ["info", "warn", "error", "log"];
methods.forEach(method => {
  const original = console[method];
  (console[method] as (...args: any[]) => void) = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("@polkadot") &&
      args[0].includes("has multiple versions")
    ) {
      return; // Suppress the Polkadot warning
    }
    (original as (...args: any[]) => void)(...prefixWithWorker(args));
  };
});

const suppressPolkadot = (chunk: any) =>
  typeof chunk === "string" &&
  chunk.includes("@polkadot") &&
  chunk.includes("has multiple versions");

const origStdoutWrite = process.stdout.write;
process.stdout.write = function (chunk: any, ...args: any[]) {
  if (suppressPolkadot(chunk)) return true;
  return origStdoutWrite.call(this, chunk, ...args);
};

const origStderrWrite = process.stderr.write;
process.stderr.write = function (chunk: any, ...args: any[]) {
  if (suppressPolkadot(chunk)) return true;
  return origStderrWrite.call(this, chunk, ...args);
};

// Prefix console logs with worker id and timestamp, and write per-worker logfile
const worker = process.env.JEST_WORKER_ID || "0";
const logDir = path.resolve("artifacts/logs");
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch {}
const logFile = path.join(logDir, `worker-${worker}.log`);
let stream: fs.WriteStream | null = null;
try {
  stream = fs.createWriteStream(logFile, { flags: "a" });
} catch {}

function prefixWithWorker(args: any[]): any[] {
  const ts = new Date().toISOString();
  const prefixed = [`[w${worker}]`, ts, ...args];
  try {
    stream?.write(prefixed.map(x => (typeof x === "string" ? x : JSON.stringify(x))).join(" ") + "\n");
  } catch {}
  return prefixed;
}
