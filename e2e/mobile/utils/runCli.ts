import { spawn } from "child_process";
import path from "path";

const scriptPath = path.resolve(__dirname, "../../../apps/cli/bin/index.js");

/**
 * Sleep for the given milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a command in the CLI with given arguments.
 * @param {string} command - The command and its arguments as a single string.
 * @returns {Promise<string>} - Resolves with the output of the command or rejects on failure.
 */
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
        reject(new Error(`CLI command failed with exit code ${code}: ${errorOutput}`));
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
 * @param retries How many times to retry on failure (default 3).
 * @param delayMs How long to wait between retries in ms (default 1000).
 */
export async function runCliCommandWithRetry(
  command: string,
  retries = 3,
  delayMs = 1000,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await runCliCommand(command);
    } catch (err: any) {
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
