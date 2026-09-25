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
 *
 * --target speculos instead picks a worker that holds a Speculos right now (from
 * the artifacts/speculos-instances.<pid>.json tracking files), then follows those
 * instances through Speculinho: before the kill, right after it, and once the
 * controller's teardown sweep has removed the dead worker's tracking file.
 */

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

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
const TARGET = arg("target", "busiest"); // busiest | speculos
const ARTIFACTS_DIR = arg("artifacts-dir", "e2e/mobile/artifacts");
const FOLLOW_TIMEOUT_S = Number(arg("follow-timeout", 1200)); // kill, then the sweep at teardown

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

let clockTicks;
function linuxClockTicks() {
  if (clockTicks === undefined) {
    try {
      clockTicks = Number(execFileSync("getconf", ["CLK_TCK"], { encoding: "utf8" }).trim()) || 100;
    } catch {
      clockTicks = 100; // USER_HZ on every mainstream Linux kernel
    }
  }
  return clockTicks;
}

// CPU seconds used by a worker so far.
function cpuSeconds(worker) {
  if (process.platform === "linux") {
    // On Linux ps only prints whole seconds, far too coarse for a 3s delta, so read
    // utime + stime (in clock ticks) from /proc. The fields are counted after the
    // parenthesised command name, which may itself contain spaces: state is field 3,
    // so utime (14) and stime (15) sit at offsets 11 and 12.
    try {
      const stat = readFileSync(`/proc/${worker.pid}/stat`, "utf8");
      const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
      return (Number(fields[11]) + Number(fields[12])) / linuxClockTicks();
    } catch {
      // process gone or no /proc: fall back to ps
    }
  }
  // ps: M:SS.ss or H:MM:SS.ss on macOS, [DD-]HH:MM:SS on Linux
  const [days, clock] = worker.time.includes("-") ? worker.time.split("-") : ["0", worker.time];
  const seconds = clock
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
  return Number(days) * 86_400 + seconds;
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
  const before = new Map(ourWorkers().map(w => [w.pid, cpuSeconds(w)]));
  if (before.size === 0) return undefined;
  await sleep(SAMPLE_S);
  let best;
  for (const worker of ourWorkers()) {
    const now = cpuSeconds(worker);
    const delta = now - (before.get(worker.pid) ?? now);
    if (delta >= MIN_DELTA_S && (!best || delta > best.delta)) best = { pid: worker.pid, delta };
  }
  return best;
}

const trackingFile = pid => path.join(ARTIFACTS_DIR, `speculos-instances.${pid}.json`);

// The Speculos run ids a worker has recorded and not yet released.
function trackedRunIds(pid) {
  try {
    return JSON.parse(readFileSync(trackingFile(pid), "utf8")).map(({ deviceId }) => deviceId);
  } catch {
    return [];
  }
}

function speculosOwner() {
  for (const worker of ourWorkers()) {
    const runIds = trackedRunIds(worker.pid);
    if (runIds.length) return { pid: worker.pid, runIds };
  }
  return undefined;
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

// What Speculinho says about one run id. Only the HTTP status, the top-level key
// names and a few short state fields are printed: these logs are public, and the
// body may describe the pod in detail.
async function speculinhoState(runId) {
  const base = process.env.SPECULINHO_URL?.trim().replace(/\/+$/, "");
  if (!base) return "no SPECULINHO_URL";
  try {
    const res = await fetch(`${base}/status/${encodeURIComponent(runId)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    let detail = "";
    try {
      const body = await res.json();
      if (body && typeof body === "object") {
        const state = ["phase", "status", "state"]
          .map(key => body[key])
          .filter(value => typeof value === "string")
          .map(value => value.slice(0, 40));
        detail = ` keys=[${Object.keys(body).slice(0, 12).join(",")}]${state.length ? ` state=${state.join("/")}` : ""}`;
      }
    } catch {
      // not JSON
    }
    return `HTTP ${res.status}${detail}`;
  } catch (error) {
    return `unreachable (${error.name})`;
  }
}

async function pickVictim() {
  const deadline = Date.now() + START_TIMEOUT_S * 1000;
  while (Date.now() < deadline) {
    if (TARGET === "speculos") {
      const owner = speculosOwner();
      if (!owner) {
        await sleep(1);
        continue;
      }
      await sleep(SETTLE_S);
      // Still holding it: a spec that finished meanwhile would test nothing.
      const runIds = trackedRunIds(owner.pid);
      if (runIds.length && isAlive(owner.pid)) {
        notice(`victim jest worker ${owner.pid}, holding Speculos ${runIds.join(", ")}`);
        return { pid: owner.pid, runIds };
      }
      continue;
    }
    const busiest = await busiestWorker();
    if (!busiest) continue;
    await sleep(SETTLE_S);
    const victim = (await busiestWorker()) ?? busiest;
    notice(`victim jest worker ${victim.pid} (+${victim.delta.toFixed(2)}s CPU in ${SAMPLE_S}s)`);
    return victim;
  }
  return undefined;
}

async function waitUntil(condition, deadline) {
  while (!condition()) {
    if (Date.now() > deadline) return false;
    await sleep(1);
  }
  return true;
}

// After the freeze: the watchdog should kill the worker, which leaves its Speculos
// allocated until the controller's globalTeardown sweeps the dead worker's file.
async function followSpeculos({ pid, runIds }, frozenAt) {
  const since = () => `+${Math.round((Date.now() - frozenAt) / 1000)}s`;
  const states = async () =>
    (await Promise.all(runIds.map(async id => `${id} ${await speculinhoState(id)}`))).join("; ");
  const report = line => {
    notice(line);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- QAA-1365 probe: ${line}\n`);
    }
  };
  const deadline = frozenAt + FOLLOW_TIMEOUT_S * 1000;

  report(`[speculos] frozen worker ${pid}. Speculinho before the kill: ${await states()}`);

  if (!(await waitUntil(() => !isAlive(pid), deadline))) {
    warn(
      `[speculos] worker ${pid} still alive ${since()} after the freeze; the watchdog never killed it`,
    );
    return;
  }
  const leftAfterKill = trackedRunIds(pid);
  report(
    `[speculos] worker ${pid} killed ${since()} after the freeze, tracking file still lists ${leftAfterKill.length} instance(s). Speculinho right after the kill: ${await states()}`,
  );

  if (!(await waitUntil(() => !existsSync(trackingFile(pid)), deadline))) {
    warn(
      `[speculos] tracking file of dead worker ${pid} still there ${since()} after the freeze; never swept`,
    );
    return;
  }
  report(
    `[speculos] dead worker ${pid}'s tracking file swept ${since()} after the freeze. Speculinho after the sweep: ${await states()}`,
  );
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
  // Wait until one of our workers is genuinely executing a spec (and, with
  // --target speculos, holding a Speculos).
  const victim = await pickVictim();
  if (!victim) {
    warn(
      `no ${TARGET === "speculos" ? "Speculos-holding" : "busy"} jest worker of this shard within ${START_TIMEOUT_S}s; nothing frozen`,
    );
    return;
  }

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
  const frozenAt = Date.now();
  await sleep(1);
  notice(`froze the JS main thread of worker ${victim.pid} at ${new Date(frozenAt).toISOString()}`);
  session.close();

  if (TARGET === "speculos") await followSpeculos(victim, frozenAt);
}

main()
  .catch(error => warn(`injection failed: ${error}; nothing frozen`))
  .finally(() => process.exit(0));
