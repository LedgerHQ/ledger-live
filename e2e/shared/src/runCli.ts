import type { GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { sanitizeError, sleep } from "@ledgerhq/live-common/e2e";
import {
  ensureE2ERuntime,
  cmdGetAddress,
  cmdLiveData,
  cmdTokenApproval,
  cmdGetTokenAllowance,
} from "@ledgerhq/live-e2e-shared/commands";
import type {
  GetAddressOpts,
  LiveDataOpts,
  TokenApprovalOpts,
  GetTokenAllowanceOpts,
} from "@ledgerhq/live-common/e2e/commands/types";

export type {
  GetAddressOpts,
  LiveDataOpts,
  TokenApprovalOpts,
  GetTokenAllowanceOpts,
} from "@ledgerhq/live-common/e2e/commands/types";

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

/** Transient failures (network, Speculos, gateway) where a retry may help. */
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

/**
 * Runs an in-process e2e command with retry on transient errors. The commands
 * are executed from the prebuilt esbuild bundle (@ledgerhq/live-e2e-shared/commands),
 * which is the only Node-runnable form of live-common's bundler-only lib-es.
 */
async function runWithRetry<T>(
  label: string,
  fn: () => Promise<T>,
  ctx: { currency?: string } = {},
  retries = 3,
  delayMs = 3000,
): Promise<T> {
  ensureE2ERuntime();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const willRetry = attempt < retries && isRetryableError(lastError.message);

      if (!willRetry) {
        throw sanitizeError(lastError);
      }

      console.warn(
        `⚠️ ${label} attempt ${attempt}/${retries}${ctx.currency ? ` for ${ctx.currency}` : ""} failed with retryable error – retrying in ${delayMs}ms…`,
        lastError.message,
      );

      await sleep(delayMs);
    }
  }

  throw sanitizeError(lastError!);
}

export function runCliLiveData(opts: LiveDataOpts): Promise<string> {
  return runWithRetry("liveData", () => cmdLiveData(opts), { currency: opts.currency });
}

export function runCliGetAddress(opts: GetAddressOpts): Promise<GetAddressResult> {
  return runWithRetry("getAddress", () => cmdGetAddress(opts), { currency: opts.currency });
}

export function runCliTokenApproval(opts: TokenApprovalOpts): Promise<string> {
  return runWithRetry("tokenApproval", () => cmdTokenApproval(opts), { currency: opts.currency });
}

export function runCliGetTokenAllowance(opts: GetTokenAllowanceOpts): Promise<string> {
  return runWithRetry("tokenAllowance", () => cmdGetTokenAllowance(opts), {
    currency: opts.currency,
  });
}
