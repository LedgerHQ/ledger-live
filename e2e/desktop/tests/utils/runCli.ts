import { spawn } from "child_process";

const scriptPath = __dirname + "/../../../../apps/cli/bin/index.js";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractFlagValue(command: string, flag: string): string | null {
  const regex = new RegExp(`--${flag}\\+([^+]+)`);
  const match = command.match(regex);
  return match ? match[1] : null;
}

/**
 * Executes a command in the CLI with given arguments.
 * @param {string} command - The command and its arguments as a single string.
 * @returns {Promise<string>} - Resolves with the output of the command or rejects on failure.
 */
export function runCliCommand(command: string): Promise<string> {
  console.log(`[CLI] Executing: ledger-live ${command.replace(/\+/g, " ")}`);

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
 * Check if an error is retryable (transient network/speculos issues)
 */
function isRetryableError(errorMessage: string): boolean {
  const retryablePatterns = [
    /503/i,
    /502/i,
    /504/i,
    /GeneralDmkError/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ECONNRESET/i,
    /socket hang up/i,
    /timeout/i,
  ];
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Executes a CLI command with retry logic for transient errors.
 * @param {string} command - The command and its arguments as a single string.
 * @param {number} retries - Number of retry attempts (default: 3).
 * @param {number} delayMs - Delay between retries in milliseconds (default: 3000).
 * @returns {Promise<string>} - Resolves with the output of the command or rejects on failure.
 */
export async function runCliCommandWithRetry(
  command: string,
  retries = 3,
  delayMs = 3000,
): Promise<string> {
  let lastError: Error | null = null;
  const currency = extractFlagValue(command, "currency");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await runCliCommand(command);
    } catch (err: unknown) {
      lastError = err as Error;
      const errorMessage = lastError?.message || String(err);
      const willRetry = attempt < retries && isRetryableError(errorMessage);

      if (!willRetry) {
        throw lastError;
      }

      console.warn(
        `⚠️ CLI attempt ${attempt}/${retries}${currency ? ` for ${currency}` : ""} failed with retryable error – retrying in ${delayMs}ms…`,
        errorMessage,
      );
      await sleep(delayMs);
    }
  }
  throw lastError!;
}
