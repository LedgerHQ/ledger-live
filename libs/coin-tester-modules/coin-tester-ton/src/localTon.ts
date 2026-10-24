import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

// `docker-compose` rejects with a plain `{ exitCode, out, err }`, not an Error.
function formatComposeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  const { exitCode, out, err } = (error ?? {}) as Partial<{
    exitCode: number | null;
    out: string;
    err: string;
  }>;
  const streams = [err?.trim(), out?.trim()].filter(Boolean).join("\n");
  return `exit code ${exitCode ?? "unknown"}${streams ? `\n${streams}` : " with no output"}`;
}

export async function spawnLocalTon(): Promise<void> {
  // A run killed before its teardown leaves the old chain behind: start from a fresh genesis.
  await killLocalTon();
  console.log("Starting the local TON chain…");
  try {
    await compose.upAll({ ...composeOpts(), commandOptions: ["--wait", "--quiet-pull"] });
  } catch (error) {
    // Jest skips globalTeardown when globalSetup throws.
    await killLocalTon().catch(() => {});
    throw new Error(`The local TON chain did not become healthy: ${formatComposeError(error)}`, {
      cause: error,
    });
  }
  console.log(chalk.bgBlueBright(" -  LOCAL TON READY ✅  - "));
}

export async function killLocalTon(): Promise<void> {
  await compose.down({ ...composeOpts(), commandOptions: ["--remove-orphans", "--volumes"] });
}
