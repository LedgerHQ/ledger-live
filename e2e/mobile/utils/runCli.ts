import { spawn } from "child_process";
import path from "path";
import { isRemoteIos } from "../helpers/commonHelpers";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";

const scriptPath = path.resolve(__dirname, "../../../apps/cli/bin/index.js");

/**
 * Sleep for the given milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extracts flag values from a CLI-style `+`-separated string.
 */
function extractFlagValue(command: string, flag: string): string | undefined {
  const parts = command.split("+");
  const idx = parts.findIndex(p => p === `--${flag}`);
  return idx !== -1 && idx + 1 < parts.length ? parts[idx + 1] : undefined;
}

/**
 * Executes a command in the CLI with given arguments.
 * @param command - The command and its arguments as a single string.
 * @param speculosAddress - The Speculos address for this command (optional).
 * @returns Resolves with the output of the command or rejects on failure.
 */
export function runCliCommand(command: string, speculosAddress?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = command.split("+");
    const env = { ...process.env };
    if (speculosAddress) {
      env.SPECULOS_ADDRESS = speculosAddress;
    }
    const child = spawn("node", [scriptPath, ...args], { stdio: "pipe", env });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", data => {
      output += data.toString();
    });

    child.stderr.on("data", data => {
      errorOutput += data.toString();
    });

    child.on("exit", code => {
      if (code === 0) {
        resolve(output);
      } else {
        const currency = extractFlagValue(command, "currency");
        const index = extractFlagValue(command, "index");

        const errorDetails = [
          `❌ Failed to setup account.`,
          currency ? `💱 Currency: ${currency}` : `💱 Currency not specified`,
          index ? `🔢 Index: ${index}` : `🔢 Index not specified`,
          errorOutput ? `🧾 CLI Error: ${errorOutput.trim()}` : "",
        ].join("\n");

        reject(new Error(errorDetails));
      }
    });

    child.on("error", error => {
      reject(new Error(`Error executing CLI command: ${error.message}`));
    });
  });
}

/**
 * Executes a CLI command with retries on failure.
 *
 * @param command The CLI command string (args joined by '+').
 * @param speculosAddress
 * @param retries How many times to retry on failure (default 3).
 * @param delayMs How long to wait between retries in ms (default 1000).
 */
export async function runCliCommandWithRetry(
  command: string,
  speculosAddress?: string,
  retries = 5,
  delayMs = 2000,
): Promise<string> {
  let lastError: Error | null = null;

  const currency = extractFlagValue(command, "currency");

  if (!currency) {
    throw new Error(
      "🚫 CLI command missing required --currency flag for Speculos readiness check.",
    );
  }

  if (isRemoteIos() && speculosAddress) {
    await waitForSpeculosReady(speculosAddress);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await runCliCommand(command, speculosAddress);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err: any
    ) {
      lastError = err;
      const willRetry = attempt < retries;

      if (!willRetry) {
        throw err;
      }

      console.warn(
        `⚠️ CLI attempt ${attempt}/${currency} failed while trying to setup test account – retrying in ${delayMs}ms…`,
      );
      await sleep(delayMs);
    }
  }
  throw lastError!;
}
