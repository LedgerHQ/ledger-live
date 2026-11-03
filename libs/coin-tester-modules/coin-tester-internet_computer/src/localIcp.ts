import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

export const NODE_URL = "http://127.0.0.1:4943";

const READY_TIMEOUT_MS = 120_000;
const READY_INTERVAL_MS = 1_000;
const REQUEST_TIMEOUT_MS = 5_000;

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The gateway answers its status endpoint (CBOR) once PocketIC runs. The NNS canisters can still be
// installing then; the tests wait for the ledger and index before they fund an account.
async function waitForGateway(): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${NODE_URL}/api/v2/status`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 200) return;
    } catch {
      // Not listening yet, or the request timed out.
    }
    await delay(READY_INTERVAL_MS);
  }
  throw new Error(`The gateway did not answer ${NODE_URL}/api/v2/status`);
}

export async function spawnLocalIcp(): Promise<void> {
  // A run killed before its teardown leaves the old network behind: start from a fresh one.
  await killLocalIcp();
  console.log("Starting the local ICP network…");
  try {
    await compose.upAll({ ...composeOpts(), commandOptions: ["--quiet-pull"] });
    await waitForGateway();
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
