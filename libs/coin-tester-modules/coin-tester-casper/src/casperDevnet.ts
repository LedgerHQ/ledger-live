import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import { DEVNET_SERVICE_NAME, userDerivationPath } from "./fixtures";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

// `docker-compose` rejects with a plain `{ exitCode, out, err }`, not an Error, so
// `String(error)` would yield "[object Object]" and hide the real docker message.
function formatComposeError(error: unknown): string {
  if (error instanceof Error) return error.message;

  const { exitCode, out, err } = (error ?? {}) as Partial<{
    exitCode: number | null;
    out: string;
    err: string;
  }>;
  const streams = [err?.trim(), out?.trim()].filter(Boolean).join("\n");
  if (!streams) return `exit code ${exitCode ?? "unknown"} with no output`;
  return `exit code ${exitCode ?? "unknown"}\n${streams}`;
}

export async function spawnDevnet(): Promise<void> {
  console.log("Starting casper devnet…");
  try {
    await compose.upOne(DEVNET_SERVICE_NAME, {
      ...composeOpts(),
      commandOptions: ["--wait"],
    });
  } catch (error) {
    throw new Error(`casper devnet did not become healthy: ${formatComposeError(error)}`);
  }
  console.log(chalk.bgBlueBright(" -  CASPER DEVNET READY ✅  - "));
}

export async function killDevnet(): Promise<void> {
  console.log("Stopping casper devnet…");
  await compose.down({
    ...composeOpts(),
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

// `--secret-key` prints a CRLF PEM block, unlike the bare-hex `--public-key`
// and `--account-hash` output.
export async function deriveUser(
  index: number,
): Promise<{ publicKey: string; secretKey: string; accountHash: string }> {
  const derivationPath = userDerivationPath(index);
  const [publicKey, secretKey, accountHash] = await Promise.all(
    ["--public-key", "--secret-key", "--account-hash"].map(flag => derive(derivationPath, flag)),
  );
  return { publicKey, secretKey, accountHash };
}

// Passed as an array: compose.exec splits a string command on whitespace,
// which would break the derivation path's `'` characters.
async function derive(derivationPath: string, flag: string): Promise<string> {
  const { out } = await compose.exec(
    DEVNET_SERVICE_NAME,
    ["casper-devnet", "derive", derivationPath, flag, "-o", "-"],
    composeOpts(),
  );
  return out.trim();
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killDevnet().catch(() => {});
  }),
);
