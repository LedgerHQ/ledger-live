import { execFile } from "child_process";
import { promisify } from "util";
import chalk from "chalk";

const execFileAsync = promisify(execFile);

const EXEC_OPTS = { env: process.env, maxBuffer: 1024 * 1024 * 64 } as const;

const SOLO_BIN = "solo"; // resolved from the package's own node_modules/.bin via pnpm

/**
 * Memoised deployment. The suite's `beforeAll` pays the 7–10 minute bring-up; `getGenesisClient()`
 * reaches `deploySolo()` too and must get it for free. The *promise* is stored rather than the
 * resolved value so two concurrent callers cannot start two deploys.
 *
 * A failed bring-up is cached on purpose: a kube/Solo failure is an environment fault, so every
 * caller should fail on it immediately rather than each spending ~10 min on a retry that will fail
 * the same way and exhaust the per-test budget.
 */
let deployment: Promise<void> | undefined;

export function deploySolo(): Promise<void> {
  deployment ??= runDeploy();
  return deployment;
}

/**
 * Deploys a single-node Hiero Solo cluster: consensus node, mirror node
 * (REST/gRPC/Web3/Importer/RestJava/Pinger), JSON-RPC relay and explorer all
 * run as pods inside one kind-managed Docker container. Requires a
 * Kubernetes >= v1.32.2 capable host (kind + kubectl + helm) with >= 12 GB
 * RAM / 6 CPU — see README "Running locally" for host prerequisites this
 * script does not install.
 */
async function runDeploy(): Promise<void> {
  console.log("Deploying Hiero Solo (one-shot, single node)…");

  // A previous run that was killed hard (or crashed before teardown) leaves its tunnels behind;
  // clean up before deploying so we never bind against — or worse, talk to — a stale one.
  await killPortForwards();

  await execFileAsync(
    SOLO_BIN,
    ["one-shot", "single", "deploy", "--quiet-mode", "--minimal-setup"],
    EXEC_OPTS,
  );

  console.log(chalk.bgBlueBright(" -  SOLO READY ✅  - "));
}

export async function teardownSolo(): Promise<void> {
  deployment = undefined;
  console.log("Tearing down Hiero Solo…");
  try {
    await execFileAsync(SOLO_BIN, ["one-shot", "single", "destroy", "--quiet-mode"], EXEC_OPTS);
  } catch (err) {
    // Best-effort: teardown must never throw and mask the real test outcome
    // (matches the yaci.ts/flextesa.ts convention in sibling testers).
    console.error("solo.ts: teardown failed (ignored):", err);
  }
  await killPortForwards();
}

/**
 * Solo's `--force-port-forward` tunnels outlive `destroy` (cluster teardown only) — spawned
 * `detached`, they get reparented to init and keep holding 35211/38081. A leftover tunnel makes
 * the next run misdiagnose a stale connection as a consensus-node failure. Best-effort: never throws.
 */
async function killPortForwards(): Promise<void> {
  if (process.platform === "win32") {
    console.warn(
      "solo.ts: no port-forward cleanup on Windows — if the next run cannot bind 35211/38081, " +
        "kill the leftover `kubectl port-forward` processes by hand.",
    );
    return;
  }

  // Both patterns are scoped to the `one-shot` namespace Solo hard-codes, so this cannot reach
  // unrelated port-forwards; and `kill` only ever reaches processes owned by the invoking user.
  // Order matters: `persist-port-forward` is designed to respawn a dropped tunnel, so its kubectl
  // child must not be killed first.
  const patterns = ["persist-port-forward.* one-shot ", "port-forward .*one-shot"];

  for (const pattern of patterns) {
    await killMatching(pattern, "SIGTERM");
  }
  // `persist-port-forward` exits ~500 ms after SIGTERM (it lets its child wind down first).
  await new Promise(resolve => setTimeout(resolve, 1000));
  for (const pattern of patterns) {
    await killMatching(pattern, "SIGKILL");
  }
}

async function killMatching(pattern: string, signal: "SIGTERM" | "SIGKILL"): Promise<void> {
  let pids: number[];
  try {
    const { stdout } = await execFileAsync("pgrep", ["-f", pattern], EXEC_OPTS);
    pids = stdout.split("\n").map(Number).filter(Boolean);
  } catch {
    // pgrep exits 1 when nothing matched: the common, healthy case. Also covers hosts without
    // pgrep, where we can do nothing anyway.
    return;
  }

  // `-f` matches whole command lines, so a shell merely *mentioning* the pattern matches too —
  // that's how a manual `pkill` once killed the calling shell itself. Never signal our own tree.
  const ownTree = await ancestorPids();

  for (const pid of pids) {
    if (ownTree.has(pid)) continue;
    try {
      process.kill(pid, signal);
      console.log(`solo.ts: sent ${signal} to leftover port-forward process ${pid}`);
    } catch {
      // Already exited between pgrep and kill, or not ours to kill.
    }
  }
}

/** Our own pid plus every parent up to init. */
async function ancestorPids(): Promise<Set<number>> {
  const pids = new Set<number>();
  let pid = process.pid;
  while (pid > 1 && !pids.has(pid)) {
    pids.add(pid);
    try {
      const { stdout } = await execFileAsync("ps", ["-o", "ppid=", "-p", String(pid)], EXEC_OPTS);
      pid = Number(stdout.trim());
    } catch {
      break;
    }
  }
  return pids;
}
