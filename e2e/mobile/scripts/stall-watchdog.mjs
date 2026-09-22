#!/usr/bin/env node
/**
 * Stall watchdog for the mobile E2E shards (QAA-1365).
 *
 * A shard can hang until the CI step's `timeout-minutes` kills it — 69 minutes of
 * runner time in the original incident — because the stall is a jest worker whose
 * event loop stopped advancing, which defeats every timeout that lives on that
 * loop (jest's `testTimeout`, setup.ts's `beforeAll`, Detox's `setupTimeout`) and
 * means `--forceExit` is never reached.
 *
 * This process watches the heartbeats written by helpers/stallHeartbeat.ts and,
 * when one goes stale, SIGKILLs that single worker. Measured on the real pipeline
 * (run 35760640035): jest then prints `FAIL <spec>` and a full `Test Suites:`
 * summary in the same second, attributing the failure to the right spec; Detox's
 * existing `--retries` re-runs only that spec; the shard finished green in 3.9min
 * instead of being killed at the step timeout, with its Allure result and timing
 * JSON intact. So the watchdog does not need to synthesise any reporting — it only
 * has to detect the stall and kill the right process.
 *
 * Because the retry makes the shard green, a stall would otherwise become
 * invisible in the job status. Every kill is therefore reported twice: as a CI
 * error annotation, and as a record in the report JSON for counting.
 *
 * Usage:
 *   node stall-watchdog.mjs --dir <heartbeat-dir> [--root-pid N] [--stall-ms N]
 *                           [--no-progress-ms N] [--poll-ms N] [--report FILE]
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = name => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
};

const DIR = arg("dir") ?? process.env.E2E_HEARTBEAT_DIR;
if (!DIR) {
  console.error("[stall-watchdog] no heartbeat dir (--dir or E2E_HEARTBEAT_DIR); not starting");
  process.exit(0);
}

// A frozen loop stops the 5s ticker immediately, so this only needs to clear
// scheduling noise — it is not bounded by any test timeout.
const STALL_MS = Number(arg("stall-ms") ?? process.env.E2E_STALL_MS ?? 90_000);
// The other shape: the loop still turns but no test boundary is reached. Must stay
// above the longest legitimate quiet stretch (jest testTimeout is 6min, and a
// Detox retry pass re-runs a whole spec).
const NO_PROGRESS_MS = Number(arg("no-progress-ms") ?? process.env.E2E_NO_PROGRESS_MS ?? 900_000);
const POLL_MS = Number(arg("poll-ms") ?? 5_000);
const ROOT_PID = Number(arg("root-pid") ?? process.ppid);
const REPORT = arg("report") ?? path.join(DIR, "..", "stall-watchdog.json");

const killed = new Set();
const warned = new Set();
const events = [];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const seconds = ms => (ms / 1000).toFixed(0);

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else — alive, and a
    // case the ownership guard below must see rather than silently discard.
    return error?.code === "EPERM";
  }
}

function parentOf(pid) {
  try {
    const out = execFileSync("ps", ["-o", "ppid=", "-p", String(pid)], { encoding: "utf8" });
    const ppid = Number(out.trim());
    return Number.isInteger(ppid) ? ppid : undefined;
  } catch {
    return undefined;
  }
}

/**
 * These are shared self-hosted runners: another job's jest workers must never be
 * touched, so a pid is only a candidate if it descends from this shard's own
 * process tree.
 */
function isOurs(pid) {
  let cursor = pid;
  for (let hop = 0; hop < 64; hop++) {
    if (cursor === ROOT_PID) return true;
    if (cursor <= 1) return false;
    const ppid = parentOf(cursor);
    if (ppid === undefined) return false;
    cursor = ppid;
  }
  return false;
}

function readHeartbeats() {
  let names = [];
  try {
    names = fs.readdirSync(DIR).filter(n => n.startsWith("worker-") && n.endsWith(".json"));
  } catch {
    return []; // the dir appears when the first worker starts
  }
  const beats = [];
  for (const name of names) {
    const file = path.join(DIR, name);
    try {
      const beat = JSON.parse(fs.readFileSync(file, "utf8"));
      if (typeof beat?.pid === "number") beats.push({ ...beat, file });
    } catch {
      // half-written or malformed: it will be re-read on the next poll
    }
  }
  return beats;
}

/**
 * Written only when something was actually killed, so the file's mere presence in
 * a shard's artifacts means "a stall happened here" — worth having, because the
 * Detox retry usually turns the shard green afterwards.
 */
function saveReport() {
  if (events.length === 0) return;
  try {
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, JSON.stringify({ events }, null, 2));
  } catch {
    // ignore
  }
}

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.log(`::warning::[stall-watchdog] ${message}`);
}

function act(beat, reason, staleMs) {
  const spec = path.basename(beat.testPath || "<unknown spec>");

  if (!beat.killable) {
    // In-band run (local maxWorkers: 1): the "worker" is the jest process itself,
    // so killing it would take the run and Detox's cleanup with it.
    warnOnce(
      `inband-${beat.pid}`,
      `${spec} stalled (${reason}, ${seconds(staleMs)}s) but the run is in-band, ` +
        `so there is no worker to kill. Use maxWorkers > 1 to let the watchdog act.`,
    );
    return;
  }

  if (!isOurs(beat.pid)) {
    warnOnce(
      `foreign-${beat.pid}`,
      `pid ${beat.pid} (${spec}) looks stalled but is not part of this shard's ` +
        `process tree; leaving it alone.`,
    );
    return;
  }

  const event = {
    at: new Date().toISOString(),
    pid: beat.pid,
    spec: beat.testPath,
    phase: beat.phase,
    reason,
    staleSeconds: Number(seconds(staleMs)),
  };

  // An error annotation, because Detox's retry usually turns the shard green
  // afterwards and the stall would otherwise leave no trace in the job status.
  console.log(
    `::error::[stall-watchdog] ${spec} stalled: ${reason} for ${seconds(staleMs)}s ` +
      `(phase "${beat.phase}", worker ${beat.pid}). Killing that worker so jest can ` +
      `attribute the failure and Detox can retry the spec.`,
  );

  try {
    process.kill(beat.pid, "SIGKILL");
    event.killed = true;
  } catch (error) {
    event.killed = false;
    event.error = String(error);
    console.log(`::warning::[stall-watchdog] SIGKILL on ${beat.pid} failed: ${error}`);
  }

  killed.add(beat.pid);
  events.push(event);
  saveReport();

  // Drop the heartbeat so a dead worker is not reported twice.
  try {
    fs.rmSync(beat.file, { force: true });
  } catch {
    // ignore
  }
}

async function main() {
  console.log(
    `[stall-watchdog] watching ${DIR} (frozen > ${seconds(STALL_MS)}s, ` +
      `no progress > ${seconds(NO_PROGRESS_MS)}s, root pid ${ROOT_PID})`,
  );

  // A heartbeat that is ALREADY stale when we start cannot be attributed to this
  // run — it is a leftover from a previous one, e.g. a worker that --forceExit
  // killed before its teardown. Drop those, so a recycled pid can never look like
  // a live stall. A fresh heartbeat is kept and watched, whoever wrote it.
  const startedAt = Date.now();
  for (const beat of readHeartbeats()) {
    if (startedAt - beat.updatedAt > STALL_MS) {
      try {
        fs.rmSync(beat.file, { force: true });
      } catch {
        // ignore
      }
    }
  }

  // Runs until the shard finishes: e2e-ci.mjs stops it once Detox exits.
  for (;;) {
    for (const beat of readHeartbeats()) {
      if (killed.has(beat.pid)) continue;
      if (!isAlive(beat.pid)) {
        try {
          fs.rmSync(beat.file, { force: true });
        } catch {
          // ignore
        }
        continue;
      }

      const now = Date.now();
      const frozenFor = now - beat.updatedAt;
      const stalledFor = now - beat.lastProgressAt;

      if (frozenFor >= STALL_MS) act(beat, "event loop frozen", frozenFor);
      else if (stalledFor >= NO_PROGRESS_MS) act(beat, "no test progress", stalledFor);
    }
    await sleep(POLL_MS);
  }
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    saveReport();
    process.exit(0);
  });
}

main().catch(error => {
  // The watchdog must never be the reason a shard fails.
  console.log(`::warning::[stall-watchdog] stopping after an internal error: ${error}`);
  process.exit(0);
});
