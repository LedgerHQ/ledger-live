import path from "path";
import { spawn } from "child_process";
import { sanitizeError, sleep } from "./index";

export const LEDGER_LIVE_CLI_BIN = path.resolve(__dirname, "../../../../apps/cli/bin/index.js");

export type LedgerKeyRingProtocolOpts = {
  initMemberCredentials?: boolean;
  apiBaseUrl?: string;
  applicationId?: number;
  name?: string;
  getKeyRingTree?: boolean;
  pubKey?: string;
  privateKey?: string;
  device?: string;
  destroyKeyRingTree?: boolean;
  rootId?: string;
  walletSyncEncryptionKey?: string;
  applicationPath?: string;
};

export type LedgerSyncOpts = {
  applicationId?: number;
  name?: string;
  apiBaseUrl?: string;
  pubKey: string;
  privateKey: string;
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  push?: boolean;
  pull?: boolean;
  data?: string;
  version?: number;
  cloudSyncApiBaseUrl?: string;
  deleteData?: boolean;
};

export type LiveDataOpts = {
  currency?: string;
  index?: number;
  scheme?: string;
  appjson?: string;
  add?: boolean;
};

export type GetAddressOpts = {
  currency?: string;
  device?: string;
  path?: string;
  derivationMode?: string;
  verify?: boolean;
};

export type TokenApprovalOpts = {
  currency: string;
  index: number;
  spender: string;
  approveAmount?: string;
  token: string;
  waitConfirmation?: boolean;
  mode: "revokeApproval" | "approve";
};

export type GetTokenAllowanceOpts = {
  currency: string;
  spenderAddress: string;
  token: string;
  index: number | string;
  format?: "json";
  ownerAddress: string;
};

function parseGetAddressCliOutput(output: string): unknown {
  const lines = output
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CLI getAddress returned empty output");
  }

  const jsonLine =
    [...lines].reverse().find(line => line.startsWith("{") || line.startsWith("[")) ?? "";

  if (!jsonLine) {
    throw new Error("CLI getAddress output does not contain JSON");
  }

  try {
    return JSON.parse(jsonLine);
  } catch {
    throw new Error("Failed to parse CLI getAddress output");
  }
}

function parseCliFlag(command: string, flag: string): string | undefined {
  const parts = command.split("+");
  const idx = parts.findIndex(p => p === `--${flag}`);
  return idx !== -1 && idx + 1 < parts.length ? parts[idx + 1] : undefined;
}

/**
 * Transient failures (network, Speculos, gateway) where a CLI retry may help.
 */
function isRetryableError(message: string): boolean {
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
  return retryablePatterns.some(pattern => pattern.test(message));
}

export function runCliCommand(command: string): Promise<string> {
  console.warn(`[CLI] Executing: ledger-live ${command.replace(/\+/g, " ")}`);

  return new Promise((resolve, reject) => {
    const args = command.split("+");
    const child = spawn("node", [LEDGER_LIVE_CLI_BIN, ...args], {
      stdio: "pipe",
      env: process.env,
    });

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
        const currency = parseCliFlag(command, "currency");
        const index = parseCliFlag(command, "index");
        const indexText = index && index !== "undefined" ? index : "N/A";

        const errorDetails = [
          `❌ Failed to execute CLI command`,
          `🔍 Command: ${command}`,
          `💱 Currency: ${currency}`,
          `🔢 Index: ${indexText}`,
          `🔢 Exit Code: ${code}`,
          errorOutput ? `🧾 CLI Error : ${errorOutput.trim()}` : "",
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
  retries: number = 3,
  delayMs: number = 3000,
): Promise<string> {
  let lastError: Error | null = null;
  const currency = parseCliFlag(command, "currency");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await runCliCommand(command);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const willRetry = attempt < retries && isRetryableError(lastError.message);

      if (!willRetry) {
        throw sanitizeError(lastError);
      }

      console.warn(
        `⚠️ CLI attempt ${attempt}/${retries}${currency ? ` for ${currency}` : ""} failed with retryable error – retrying in ${delayMs}ms…`,
        lastError.message,
      );

      await sleep(delayMs);
    }
  }

  throw sanitizeError(lastError!);
}

export function runCliLiveData(opts: LiveDataOpts): Promise<string> {
  const cliOpts = ["liveData"];
  if (opts.currency) cliOpts.push(`--currency+${opts.currency}`);
  if (opts.index !== undefined) cliOpts.push(`--index+${opts.index}`);
  if (opts.appjson) cliOpts.push(`--appjson+${opts.appjson}`);
  if (opts.scheme) cliOpts.push(`--scheme+${opts.scheme}`);
  if (opts.add) cliOpts.push("--add");
  return runCliCommandWithRetry(cliOpts.join("+"));
}

export async function runCliGetAddress(opts: GetAddressOpts): Promise<{ address: string }> {
  const cliOpts = ["getAddress"];
  if (opts.currency) cliOpts.push(`--currency+${opts.currency}`);
  if (opts.device) cliOpts.push(`--device+${opts.device}`);
  if (opts.path) cliOpts.push(`--path+${opts.path}`);
  if (opts.derivationMode) cliOpts.push(`--derivationMode+${opts.derivationMode}`);
  if (opts.verify) cliOpts.push("--verify");
  const output = await runCliCommandWithRetry(cliOpts.join("+"));
  return parseGetAddressCliOutput(output) as { address: string };
}

export function runCliTokenApproval(opts: TokenApprovalOpts): Promise<string> {
  const cliOpts = ["send"];
  cliOpts.push(`--currency+${opts.currency}`);
  cliOpts.push(`--mode+${opts.mode}`);
  cliOpts.push(`--token+${opts.token}`);
  cliOpts.push(`--spender+${opts.spender}`);
  cliOpts.push(`--index+${opts.index}`);
  if (opts.approveAmount) cliOpts.push(`--approveAmount+${opts.approveAmount}`);
  if (opts.waitConfirmation) cliOpts.push("--wait-confirmation");
  return runCliCommandWithRetry(cliOpts.join("+"));
}

export function runCliGetTokenAllowance(opts: GetTokenAllowanceOpts): Promise<string> {
  const cliOpts = ["tokenAllowance"];
  cliOpts.push(`--currency+${opts.currency}`);
  cliOpts.push(`--spender+${opts.spenderAddress}`);
  cliOpts.push(`--token+${opts.token}`);
  cliOpts.push(`--index+${opts.index}`);
  if (opts.format === "json") cliOpts.push("--format+json");
  if (opts.ownerAddress) cliOpts.push(`--ownerAddress+${opts.ownerAddress}`);
  return runCliCommandWithRetry(cliOpts.join("+"));
}
