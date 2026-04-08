/**
 * Shared ledger-live CLI command strings and option types for desktop / mobile E2E.
 * Platform code supplies {@link runCli} (spawn path, retries, etc.).
 */

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

export function buildLiveDataCliCommand(opts: LiveDataOpts): string {
  const cliOpts = ["liveData"];

  if (opts.currency) {
    cliOpts.push(`--currency+${opts.currency}`);
  }

  if (opts.index !== undefined) {
    cliOpts.push(`--index+${opts.index}`);
  }

  if (opts.appjson) {
    cliOpts.push(`--appjson+${opts.appjson}`);
  }

  if (opts.scheme) {
    cliOpts.push(`--scheme+${opts.scheme}`);
  }

  if (opts.add) {
    cliOpts.push("--add");
  }

  return cliOpts.join("+");
}

export function buildGetAddressCliCommand(opts: GetAddressOpts): string {
  const cliOpts = ["getAddress"];

  if (opts.currency) {
    cliOpts.push(`--currency+${opts.currency}`);
  }

  if (opts.device) {
    cliOpts.push(`--device+${opts.device}`);
  }

  if (opts.path) {
    cliOpts.push(`--path+${opts.path}`);
  }

  if (opts.derivationMode) {
    cliOpts.push(`--derivationMode+${opts.derivationMode}`);
  }

  if (opts.verify) {
    cliOpts.push("--verify");
  }

  return cliOpts.join("+");
}

export function buildTokenApprovalCliCommand(opts: TokenApprovalOpts): string {
  const cliOpts = ["send"];
  cliOpts.push(`--currency+${opts.currency}`);
  cliOpts.push(`--mode+${opts.mode}`);
  cliOpts.push(`--token+${opts.token}`);
  cliOpts.push(`--spender+${opts.spender}`);
  cliOpts.push(`--index+${opts.index}`);
  if (opts.approveAmount) {
    cliOpts.push(`--approveAmount+${opts.approveAmount}`);
  }
  if (opts.waitConfirmation) {
    cliOpts.push("--wait-confirmation");
  }
  return cliOpts.join("+");
}

export function buildGetTokenAllowanceCliCommand(opts: GetTokenAllowanceOpts): string {
  const cliOpts = ["tokenAllowance"];
  cliOpts.push(`--currency+${opts.currency}`);
  cliOpts.push(`--spender+${opts.spenderAddress}`);
  cliOpts.push(`--token+${opts.token}`);
  cliOpts.push(`--index+${opts.index}`);
  if (opts.format === "json") {
    cliOpts.push("--format+json");
  }
  if (opts.ownerAddress) {
    cliOpts.push(`--ownerAddress+${opts.ownerAddress}`);
  }
  return cliOpts.join("+");
}

/**
 * Parses JSON from `getAddress` CLI output (handles extra log lines around the payload).
 */
export function parseGetAddressCliOutput(output: string): unknown {
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
