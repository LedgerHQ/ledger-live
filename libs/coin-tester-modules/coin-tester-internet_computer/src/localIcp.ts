import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

export const NODE_URL = "http://127.0.0.1:4943";

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

export async function spawnLocalIcp(): Promise<void> {
  // A run killed before its teardown leaves the old network behind: start from a fresh one.
  await killLocalIcp();
  console.log("Starting the local ICP network…");
  try {
    // `--wait` returns once the gateway listens. The NNS canisters can still be installing then;
    // the tests wait for the ledger and index before they fund an account.
    await compose.upAll({ ...composeOpts(), commandOptions: ["--wait", "--quiet-pull"] });
  } catch (error) {
    const { out: logs } = await compose
      .logs([], { ...composeOpts(), commandOptions: ["--no-color", "--tail", "50"] })
      .catch(() => ({ out: "" }));
    // Jest skips globalTeardown when globalSetup throws.
    await killLocalIcp().catch(cleanupError =>
      console.warn(`The local ICP network cleanup failed: ${formatComposeError(cleanupError)}`),
    );
    throw new Error(
      `The local ICP network did not become ready: ${formatComposeError(error)}\n${logs}`,
      { cause: error },
    );
  }
  console.log(chalk.bgBlueBright(" -  LOCAL ICP READY ✅  - "));
}

export async function killLocalIcp(): Promise<void> {
  await compose.down({ ...composeOpts(), commandOptions: ["--remove-orphans", "--volumes"] });
}
