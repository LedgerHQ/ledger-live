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
 * Dedicated deployment + namespace. Keeps our cluster state cleanly separated from Solo's default
 * `one-shot` name — and from any leftover state on the machine.
 */
const DEPLOYMENT_NAME = "coin-tester-hedera";

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
 * `solo one-shot falcon deploy` writes account material to
 * `<SOLO_HOME>/one-shot-<deployment>/accounts.json`.
 */
const oneShotOutputDir = () =>
  join(process.env.SOLO_HOME ?? join(homedir(), ".solo"), `one-shot-${DEPLOYMENT_NAME}`);

export function deploySolo(): Promise<void> {
  deployment ??= runDeploy();
  return deployment;
}

async function runDeploy(): Promise<void> {
  console.log("Deploying Hiero Solo (one-shot falcon, single node)…");

  // This `falcon deploy` path registers `--no-deploy-relay` / `--no-deploy-explorer` to skip the
  // JSON-RPC relay (~170 MB) and the explorer. The tester only ever talks to the consensus node
  // (35211) and the mirror node REST API (38081), so both would otherwise ride along unused;
  // dropping them cuts two pods off the RAM peak.
  //
  // No pre-deploy cleanup here: like every sibling tester (anvil/agave/flextesa/yaci), bring-up
  // only starts things. All teardown lives in `teardownSolo` (afterAll + the process-exit handlers
  // in scenarii.test.ts). Trade-off: a run killed by SIGKILL/OOM/power-loss bypasses those handlers
  // and leaves registered state that a later `deploy --quiet-mode` rejects — recover once by hand
  // with `solo one-shot falcon destroy --deployment coin-tester-hedera`.
  await execFileAsync(
    SOLO_BIN,
    [
      "one-shot",
      "falcon",
      "deploy",
      "--deployment",
      DEPLOYMENT_NAME,
      "--namespace",
      DEPLOYMENT_NAME,
      "--no-deploy-relay",
      "--no-deploy-explorer",
      "--quiet-mode",
    ],
    EXEC_OPTS,
  );

  console.log(chalk.bgBlueBright(" -  SOLO READY ✅  - "));
}

export async function teardownSolo(): Promise<void> {
  deployment = undefined;
  console.log("Tearing down Hiero Solo…");
  await destroyQuietly();
  // `destroy` skips its own "Remove output directory" step whenever Solo's local config lists no
  // deployment ("No deployments found in local config") — exactly the state a hard-killed or
  // foreign run leaves behind. The stale accounts.json then keeps tripping the next
  // `deploy --quiet-mode` guard forever. The directory is per-deployment scratch Solo rewrites on
  // every deploy, so removing it ourselves is safe and keeps teardown's slate truly clean.
  await rm(oneShotOutputDir(), { recursive: true, force: true });
  await killPortForwards();
}

/**
 * `solo one-shot falcon destroy`, best-effort: it must never throw when tearing down — that would
 * mask the real test outcome (matches the yaci.ts/flextesa.ts convention in sibling testers).
 */
async function destroyQuietly(): Promise<void> {
  try {
    await execFileAsync(
      SOLO_BIN,
      ["one-shot", "falcon", "destroy", "--deployment", DEPLOYMENT_NAME, "--quiet-mode"],
      EXEC_OPTS,
    );
  } catch (err) {
    console.error("solo.ts: `one-shot falcon destroy` failed (ignored):", err);
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

  // Both patterns are scoped to our dedicated `coin-tester-hedera` namespace, so this cannot reach
  // unrelated port-forwards; and `kill` only ever reaches processes owned by the invoking user.
  // Order matters: `persist-port-forward` is designed to respawn a dropped tunnel, so its kubectl
  // child must not be killed first.
  const patterns = [
    `persist-port-forward.* ${DEPLOYMENT_NAME} `,
    `port-forward .*${DEPLOYMENT_NAME}`,
  ];

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
