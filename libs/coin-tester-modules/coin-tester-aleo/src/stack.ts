import { execFileSync } from "child_process";
import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import { ALEO_LOCAL_NODE, ALEO_NETWORK_TYPE } from "./fixtures";
import { resetConfirmedTransactionCache } from "./msw/node";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DOWN_ARGS = ["--remove-orphans", "--volumes"];
/** Must match `container_name` of every service in docker-compose.yml. */
const CONTAINER_NAMES = ["aleo-devnode", "aleo-backend"];

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

let stopped = true;
let teardownRegistered = false;

/**
 * Best-effort synchronous teardown for signal and exit handlers.
 *
 * Sync and `docker rm -f`, not async `compose down`: the runner exits without
 * awaiting pending promises, and Ctrl-C kills this process along with pnpm's
 * whole process group before a slower `compose down` could finish. This is a
 * race that can be lost; spawnStack's own cleanup is the real guarantee.
 */
function killStackSync() {
  if (stopped) return;
  stopped = true;
  try {
    execFileSync("docker", ["rm", "-f", ...CONTAINER_NAMES], {
      cwd: PACKAGE_ROOT,
      stdio: process.env.DEBUG ? "inherit" : "ignore",
    });
  } catch {
    // Must not throw on the way out.
  }
}

/** Tears the stack down on the ways a run can end without unwinding normally. */
export function registerTeardownHooks() {
  if (teardownRegistered) return;
  teardownRegistered = true;

  process.on("exit", killStackSync);

  // Registering a listener replaces Node's default terminate-on-signal
  // behaviour, so the handler must exit explicitly or the run hangs.
  for (const signal of ["SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2"] as const) {
    process.on(signal, () => {
      killStackSync();
      process.exit(signal === "SIGINT" ? 130 : 143);
    });
  }

  process.on("uncaughtException", error => {
    killStackSync();
    throw error;
  });
}

export async function spawnStack() {
  registerTeardownHooks();
  // The chain is about to be recreated from height 0.
  resetConfirmedTransactionCache();

  // Interrupt-time teardown can be killed mid-`compose down`, so a stale
  // container may still hold a port from a previous run; clear it first.
  await compose.down({
    ...composeOpts(),
    commandOptions: DOWN_ARGS,
  });

  console.log("Building the stack images (devnode: leo binary download; backend: cargo build)...");
  await compose.buildAll(composeOpts());

  console.log("Starting the Aleo stack...");
  stopped = false;
  // `--wait` blocks on both healthchecks, which pass only once each service
  // is actually serving, not merely once its process is up.
  await compose.upAll({
    ...composeOpts(),
    commandOptions: ["--wait"],
  });

  const height = await getBlockHeight();
  console.log(chalk.bgBlueBright(` -  ALEO STACK READY ✅  (height ${height})  - `));
}

export async function killStack() {
  if (stopped) return;
  stopped = true;

  console.log("Stopping the Aleo stack...");
  await compose.down({
    ...composeOpts(),
    commandOptions: DOWN_ARGS,
  });
}

export async function getBlockHeight(): Promise<number> {
  const response = await fetch(`${ALEO_LOCAL_NODE}/${ALEO_NETWORK_TYPE}/block/height/latest`);
  if (!response.ok) {
    throw new Error(`Could not read the latest block height: HTTP ${response.status}`);
  }
  return Number(await response.text());
}

/**
 * Seals `count` blocks. A devnode has no consensus — it only seals a block on
 * a broadcast transaction or on this call — so scenarios waiting on height
 * (confirmations, a finalized mapping read) must drive it explicitly.
 */
export async function advanceBlocks(count = 1): Promise<number> {
  for (let i = 0; i < count; i++) {
    // The route deserializes a body: no body is a 500, no content-type a 415.
    const response = await fetch(`${ALEO_LOCAL_NODE}/${ALEO_NETWORK_TYPE}/block/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) {
      throw new Error(`Could not advance the devnode: HTTP ${response.status}`);
    }
  }
  return getBlockHeight();
}
