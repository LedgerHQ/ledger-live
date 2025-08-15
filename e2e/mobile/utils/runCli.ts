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
        reject(new Error(`CLI command failed with exit code ${code}: ${errorOutput}`));
      }
    });

    child.on("error", error => {
      reject(new Error(`Error executing CLI command: ${error.message}`));
    });
  });
}

export async function runCliCommandWithRetry(
  command: string,
  speculosAddress?: string,
  retries = 5,
  delayMs = 2000,
): Promise<string> {
  let lastError: Error | null = null;

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
      const willRetry = attempt < retries && /status code 503/.test(err.message);

      if (!willRetry) {
        throw err;
      }

      console.warn(`CLI attempt ${attempt} failed with 503 – retrying in ${delayMs}ms…`);
      await sleep(delayMs);
    }
  }
  throw lastError!;
}
