import { execFileSync } from "child_process";
import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import { getLatestHeight, resetBlockCache } from "./devnode";
import { resetSponsor } from "./msw/sponsor";

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

// Sync `docker rm -f`: exit/signal handlers cannot await an async `compose down`.
function killStackSync() {
  if (stopped) return;
  stopped = true;
  try {
    execFileSync("docker", ["rm", "-f", ...CONTAINER_NAMES], {
      cwd: PACKAGE_ROOT,
      stdio: process.env.DEBUG ? "inherit" : "ignore",
    });
  } catch {
    // best-effort on the way out
  }
}

export function registerTeardownHooks() {
  if (teardownRegistered) return;
  teardownRegistered = true;

  process.on("exit", killStackSync);

  // A signal listener replaces Node's default exit, so it must exit explicitly.
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
  // Module state outlives the stack: anything cached from a previous devnode is gone with it.
  resetBlockCache();
  resetSponsor();

  // An interrupted previous run may have left a container holding the ports.
  await compose.down({
    ...composeOpts(),
    commandOptions: DOWN_ARGS,
  });

  console.log("Building the stack images (devnode: leo binary download)...");
  await compose.buildAll(composeOpts());

  console.log("Starting the Aleo stack...");
  stopped = false;
  await compose.upAll({
    ...composeOpts(),
    commandOptions: ["--wait"],
  });

  const height = await getLatestHeight();
  console.log(chalk.bgBlueBright(` -  ALEO STACK READY ✅  (height ${height})  - `));
}

export async function killStack() {
  if (stopped) return;

  console.log("Stopping the Aleo stack...");
  await compose.down({
    ...composeOpts(),
    commandOptions: DOWN_ARGS,
  });
  // Only once down succeeded: a failed down leaves the exit hook's sync fallback armed.
  stopped = true;
}
