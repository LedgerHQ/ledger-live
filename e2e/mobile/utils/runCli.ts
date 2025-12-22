import { spawn } from "child_process";
import path from "path";
import type { LiveDataOpts } from "./cliUtils";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

const scriptPath = path.resolve(__dirname, "../../../apps/cli/bin/index.js");

/**
 * Sleep for the given milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractFlagValue<K extends keyof LiveDataOpts>(
  command: string,
  flag: K,
): string | undefined {
  const parts = command.split("+");
  const idx = parts.findIndex(p => p === `--${flag}`);
  return idx !== -1 && idx + 1 < parts.length ? parts[idx + 1] : undefined;
}

export function runCliCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = command.split("+");
    const child = spawn("node", [scriptPath, ...args], { stdio: "pipe", env: process.env });

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
        const indexText = index && index !== "undefined" ? index : "N/A";

        const errorDetails = [
          `❌ Failed to setup account.`,
          `💱 Currency: ${currency}`,
          `🔢 Index: ${indexText}`,
          errorOutput ? `🧾 CLI Error: ${errorOutput.trim()}` : "",
        ].join("\n");

        reject(new Error(errorDetails));
      }
    });

    child.on("error", error => {
      reject(new Error(`Error executing CLI command: ${sanitizeError(error)}`));
    });
  });
}

export async function runCliCommandWithRetry(
  command: string,
  retries = 5,
  delayMs = 2000,
): Promise<string> {
  let lastError: Error | null = null;

  const currency = extractFlagValue(command, "currency");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await runCliCommand(command);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err: any
    ) {
      lastError = err;
      const willRetry = attempt < retries;

      if (!willRetry) {
        throw sanitizeError(err);
      }

      console.warn(
        `⚠️ CLI attempt ${attempt} / ${currency} failed while trying to setup test account – retrying in ${delayMs}ms…`,
      );
      await sleep(delayMs);
    }
  }
  throw sanitizeError(lastError);
}
