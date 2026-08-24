import { randomUUID } from "node:crypto";
import { LedgerSyncCliHelper } from "./helper";
import type { LedgerSyncAccountDescriptor } from "./testData";

/**
 * Setup steps shared by the desktop and mobile Ledger Sync suites. These are plain async
 * functions on purpose: each suite wraps them in its own runner hooks (`test.beforeAll` on
 * Playwright, `beforeAll` on Jest/Detox) rather than the shared layer reaching for a runner.
 */
export type LedgerSyncCliCommand = (userdataPath?: string) => Promise<unknown>;

/**
 * A seed per run, so every test builds its trustchain from scratch instead of clearing whatever
 * the previous run left on the backend. That removes the destroy-then-recreate burst the suites
 * used to open with, and with it a version counter, member list and data set to reset.
 */
export function generateLedgerSyncSeed(): string {
  return `LS_E2E_${randomUUID()}`;
}

export function initializeEmptyTrustchain(): LedgerSyncCliCommand[] {
  return [
    LedgerSyncCliHelper.initializeLedgerKeyRingProtocol,
    LedgerSyncCliHelper.initializeLedgerSync,
  ];
}

export function pushAccountsToTrustchain(
  descriptors: LedgerSyncAccountDescriptor[],
  accountNames: Record<string, string> = {},
): LedgerSyncCliCommand {
  return () => LedgerSyncCliHelper.pushAccountsToTrustchain(descriptors, accountNames);
}

export function addTrustchainMember(name: string): LedgerSyncCliCommand {
  return () => LedgerSyncCliHelper.addTrustchainMember(name);
}

/**
 * Raised when the trustchain no longer exists, so a test that deleted it has nothing to clean.
 * `TrustchainEjected` and `TrustchainNotAllowed` come from `withAuth` once the member is gone;
 * `LedgerAPI4xx` is the raw form when the 4xx message misses the strings the SDK maps on; and
 * `CloudSyncHttpError` is what the cloud-sync delete throws for data that was never pushed.
 */
const ALREADY_DESTROYED_ERRORS = new Set([
  "CloudSyncHttpError",
  "LedgerAPI4xx",
  "TrustchainEjected",
  "TrustchainNotAllowed",
]);

/**
 * Best-effort teardown: a generated seed makes the trustchain unreachable once the run ends, so
 * this is the only thing keeping the backend from accumulating orphans. Stays quiet when the
 * trustchain is already gone, which is the normal outcome for a test that deletes its own backup.
 */
export async function destroyTrustchain(): Promise<void> {
  const { pubKey } = LedgerSyncCliHelper.ledgerKeyRingProtocolArgs;
  const { rootId } = LedgerSyncCliHelper.ledgerSyncPushDataArgs;
  if (!pubKey || !rootId) return;

  try {
    await LedgerSyncCliHelper.deleteLedgerSyncData();
  } catch (error) {
    if (error instanceof Error && ALREADY_DESTROYED_ERRORS.has(error.name)) return;
    console.error(`[E2E] Ledger Sync cleanup failed for trustchain ${rootId}:`, error);
  }
}
