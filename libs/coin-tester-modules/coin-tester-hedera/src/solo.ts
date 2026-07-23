import { execFile } from "child_process";
import { rm } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
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

/**
 * `solo one-shot single deploy` hard-codes both the deployment name and the namespace to
 * "one-shot", and writes account material to `<SOLO_HOME>/<deployment>-<namespace>/accounts.json`.
 */
const oneShotOutputDir = () =>
  join(process.env.SOLO_HOME ?? join(homedir(), ".solo"), "one-shot-one-shot");

export function deploySolo(): Promise<void> {
  deployment ??= runDeploy();
  return deployment;
}

/**
 * Deploys a single-node Hiero Solo cluster: consensus node, mirror node
 * (REST/gRPC/Web3/Importer/RestJava/Pinger) and its Postgres/Redis/MinIO backing
 * services run as pods inside one kind-managed Docker container. Requires a
 * Kubernetes >= v1.32.2 capable host (kind + kubectl + helm) with >= 12 GB
 * RAM / 6 CPU — see README "Running locally" for host prerequisites this
 * script does not install.
 */
async function runDeploy(): Promise<void> {
  console.log("Deploying Hiero Solo (one-shot, single node)…");

  // A previous run that was killed hard (or crashed before teardown) leaves its tunnels behind;
  // clean up before deploying so we never bind against — or worse, talk to — a stale one.
  await killPortForwards();

  // Since Solo 0.82 (still true in 0.83), `deploy` refuses to auto-clean pre-existing one-shot
  // state while `--quiet-mode` is set: it throws `ConfirmationRequiredSoloError` for an interactive
  // confirmation it cannot show, and tells you to run `destroy` explicitly instead. (Verified in
  // 0.83's `default-one-shot-deploy-orchestrator.js`: the auto-clean phase is gated on
  // `quiet !== true`.) "Pre-existing state" includes a leftover accounts.json in
  // `<SOLO_HOME>/one-shot-one-shot/`, which every previous run writes — so without this, the
  // second deploy on a machine always fails. `destroy` removes that directory, so this is the
  // supported way to start from a clean slate.
  await destroyQuietly();

  // …except `destroy` skips its own "Remove output directory" step whenever Solo's local config
  // lists no deployment ("No deployments found in local config"), which is exactly the state a
  // hard-killed or foreign run leaves behind. The stale accounts.json then keeps tripping the
  // deploy guard forever. The directory is per-deployment scratch state Solo rewrites on every
  // deploy, so removing it ourselves is safe and breaks the deadlock.
  await rm(oneShotOutputDir(), { recursive: true, force: true });

  // `--minimal-setup` is a no-op through Solo 0.83, kept only because it states the intent and
  // should start working again upstream. `minimalSetup` is read in exactly two places — the skip
  // conditions of the explorer and relay phases, both spelled `!deployExplorer && !minimalSetup`
  // — and since `deployExplorer`/`deployRelay` default to true, that expression is false either
  // way. The obvious fix, `--deploy-explorer=false --deploy-relay=false`, is rejected by this
  // command path: "Unknown arguments: deploy-explorer, deployExplorer, deploy-relay, deployRelay".
  // So the JSON-RPC relay (~170 MB) and the explorer ride along unused; the tester only ever talks
  // to the consensus node (35211) and the mirror node REST API (38081).
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
  await destroyQuietly();
  await killPortForwards();
}

/**
 * `solo one-shot single destroy`, best-effort: it must never throw, neither when tearing down
 * (that would mask the real test outcome — matches the yaci.ts/flextesa.ts convention in sibling
 * testers) nor when clearing the slate before a deploy (nothing to destroy is the healthy case).
 */
async function destroyQuietly(): Promise<void> {
  try {
    await execFileAsync(SOLO_BIN, ["one-shot", "single", "destroy", "--quiet-mode"], EXEC_OPTS);
  } catch (err) {
    console.error("solo.ts: `one-shot single destroy` failed (ignored):", err);
  }
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
