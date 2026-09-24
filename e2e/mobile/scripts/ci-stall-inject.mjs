#!/usr/bin/env node
/**
 * QAA-1365 CI probe: freeze one jest worker of THIS shard, mid-spec, to validate
 * the in-process stall watchdog on the real pipeline.
 *
 *   node ci-stall-inject.mjs --root-pid <pid>
 *
 * Why not SIGSTOP: it stops every thread of the process, the watchdog thread
 * included, so an in-process watchdog could never be tested with it. Instead this
 * opens the worker's inspector with SIGUSR1 and has it evaluate an Atomics.wait,
 * which freezes only the JS main thread — the same shape as the real stall.
 *
 * Targeting:
 * - Only descendants of <root-pid> are candidates: these are shared self-hosted
 *   runners, and another job's jest workers must never be touched.
 * - The victim is the worker burning the most CPU *right now* (delta over a short
 *   window). Cumulative CPU picks the worker most likely to have finished already,
 *   and freezing an idle worker tests nothing (run 35756645919).
 * - No log markers: under CI's --loglevel warn they are all hidden.
 * - Before freezing, the inspector is asked for its process.pid. If port 9229
 *   belongs to anything but our victim, nothing is frozen.
 */

import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const ROOT = Number(arg("root-pid"));
const START_TIMEOUT_S = Number(arg("start-timeout", 360)); // app launch takes 40-95s
const SETTLE_S = Number(arg("settle", 15)); // specs only run ~50-70s in CI: freeze early
const SAMPLE_S = Number(arg("sample", 3));
const MIN_DELTA_S = Number(arg("min-delta", 0.2));
const PORT = Number(arg("port", 9229));

const notice = message => console.log(`::notice::QAA-1365 probe: ${message}`);
const warn = message => console.log(`::warning::QAA-1365 probe: ${message}`);
const sleep = s => new Promise(resolve => setTimeout(resolve, s * 1000));

if (!Number.isInteger(ROOT) || ROOT <= 1) {
  warn("--root-pid is required; nothing frozen");
  process.exit(0);
}

function processTable() {
  const out = execFileSync("ps", ["-A", "-o", "pid=,ppid=,time=,command="], { encoding: "utf8" });
  return out
    .split("\n")
    .map(line => line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/))
    .filter(Boolean)
    .map(([, pid, ppid, time, command]) => ({ pid: +pid, ppid: +ppid, time, command }));
}

// ps prints CPU time as M:SS.ss or H:MM:SS.ss
function cpuSeconds(time) {
  const parts = time.split(":").map(Number);
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function ourWorkers() {
  const rows = processTable();
  const children = new Map();
  for (const row of rows) {
    if (!children.has(row.ppid)) children.set(row.ppid, []);
    children.get(row.ppid).push(row);
  }
  const workers = [];
  const queue = [ROOT];
  while (queue.length) {
    for (const child of children.get(queue.shift()) ?? []) {
      queue.push(child.pid);
      if (child.command.includes("jest-worker/build/processChild")) workers.push(child);
    }
  }
  return workers;
}

async function busiestWorker() {
  const before = new Map(ourWorkers().map(w => [w.pid, cpuSeconds(w.time)]));
  if (before.size === 0) return undefined;
  await sleep(SAMPLE_S);
  let best;
  for (const worker of ourWorkers()) {
    const delta = cpuSeconds(worker.time) - (before.get(worker.pid) ?? cpuSeconds(worker.time));
    if (delta >= MIN_DELTA_S && (!best || delta > best.delta)) best = { pid: worker.pid, delta };
  }
  return best;
}

async function inspectorTarget() {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const [target] = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      if (target?.webSocketDebuggerUrl) return target;
    } catch {
      // not listening yet
    }
    await sleep(0.5);
  }
  return undefined;
}

function cdp(url) {
  const ws = new WebSocket(url);
  let nextId = 1;
  const pending = new Map();
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  return {
    open: () =>
      new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", () => reject(new Error("inspector connection failed")), {
          once: true,
        });
      }),
    // Resolves with the reply, or never for an expression that never returns.
    evaluate: expression =>
      new Promise(resolve => {
        const id = nextId++;
        pending.set(id, resolve);
        ws.send(
          JSON.stringify({
            id,
            method: "Runtime.evaluate",
            params: { expression, returnByValue: true },
          }),
        );
      }),
    close: () => ws.close(),
  };
}

async function main() {
  // Wait until one of our workers is genuinely executing a spec.
  let victim;
  const deadline = Date.now() + START_TIMEOUT_S * 1000;
  while (!victim && Date.now() < deadline) victim = await busiestWorker();
  if (!victim) {
    warn(`no busy jest worker of this shard within ${START_TIMEOUT_S}s; nothing frozen`);
    return;
  }

  await sleep(SETTLE_S);
  victim = (await busiestWorker()) ?? victim;
  notice(`victim jest worker ${victim.pid} (+${victim.delta.toFixed(2)}s CPU in ${SAMPLE_S}s)`);

  process.kill(victim.pid, "SIGUSR1");
  const target = await inspectorTarget();
  if (!target) {
    warn(`inspector of ${victim.pid} never came up on port ${PORT}; nothing frozen`);
    return;
  }

  const session = cdp(target.webSocketDebuggerUrl);
  await session.open();
  const reply = await session.evaluate("process.pid");
  const inspectedPid = reply?.result?.result?.value;
  if (inspectedPid !== victim.pid) {
    warn(
      `port ${PORT} belongs to pid ${inspectedPid}, not our victim ${victim.pid}; nothing frozen`,
    );
    session.close();
    return;
  }

  // Never replies: that is the point.
  void session.evaluate(
    "(function injectedFreeze() { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0); })()",
  );
  await sleep(1);
  notice(`froze the JS main thread of worker ${victim.pid} at ${new Date().toISOString()}`);
  session.close();
}

main()
  .catch(error => warn(`injection failed: ${error}; nothing frozen`))
  .finally(() => process.exit(0));
