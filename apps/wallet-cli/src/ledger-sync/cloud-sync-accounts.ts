import { accountDescriptorSchema, type AccountDescriptor } from "@ledgerhq/live-wallet/accounts";
import { CloudSyncSDK, type UpdateEvent } from "@shared/cloud-sync";
import type { Trustchain, MemberCredentials, TrustchainSDK } from "@shared/cloud-sync";
import { getEnv } from "@shared/env";
import {
  toV1,
  serializeNetwork,
  UnsupportedFamilyError,
  UnknownNetworkError,
  AccountDescriptorV1Schema,
  type AccountDescriptorV0,
} from "../shared/accountDescriptor";
import { Session } from "../session/session-store";

/** Ledger Sync's Cloud Sync "slug" for the account-list document — matches Desktop/Mobile's
 * `liveSlug` (see docs/ledger-sync/04-cloud-sync-sdk.md and useWatchWalletSync.ts). */
const LIVE_SLUG = "live";

export type LedgerSyncEnvironment = "staging" | "production";

function cloudSyncApiBaseUrl(environment: LedgerSyncEnvironment): string {
  return environment === "production"
    ? getEnv("CLOUD_SYNC_API_PROD")
    : getEnv("CLOUD_SYNC_API_STAGING");
}

// ---------------------------------------------------------------------------
// Pulling the raw synced document (network + auth; not unit-tested directly)
// ---------------------------------------------------------------------------

export type PullResult =
  | { status: "new-data"; accounts: unknown[]; version: number }
  | { status: "up-to-date" }
  | { status: "deleted" };

/**
 * Pull the Ledger Sync account-list document for the given trustchain/member. Read-only: this
 * ticket (NTTVS-728) never pushes wallet-cli-local accounts back to Ledger Sync.
 *
 * The envelope is intentionally NOT schema-validated as a whole here — a single malformed entry
 * inside `accounts` must never invalidate the rest of the document. Per-entry validation happens in
 * `mergeSyncedAccounts` below, so one corrupt remote entry is isolated instead of failing the pull.
 */
export async function pullSyncedAccounts(
  trustchain: Trustchain,
  memberCredentials: MemberCredentials,
  trustchainSdk: TrustchainSDK,
  environment: LedgerSyncEnvironment,
  getCurrentVersion: () => number | undefined,
): Promise<PullResult> {
  let result: PullResult = { status: "up-to-date" };

  const saveNewUpdate = async (event: UpdateEvent<Record<string, unknown>>): Promise<void> => {
    if (event.type === "deleted-data") {
      result = { status: "deleted" };
      return;
    }
    const rawAccounts = event.data.accounts;
    result = {
      status: "new-data",
      accounts: Array.isArray(rawAccounts) ? rawAccounts : [],
      version: event.version,
    };
  };

  const sdk = new CloudSyncSDK<Record<string, unknown>>({
    apiBaseUrl: cloudSyncApiBaseUrl(environment),
    slug: LIVE_SLUG,
    trustchainSdk,
    getCurrentVersion,
    saveNewUpdate,
  });
  try {
    await sdk.pull(trustchain, memberCredentials);
  } catch (e) {
    // CloudSyncSDK.pull() (shared/cloud-sync/src/cloudsync/sdk.ts) deliberately throws
    // TrustchainOutdated right after calling saveNewUpdate({type: "deleted-data"}) when the remote
    // document was deleted — by then `result` above is already `{status: "deleted"}`, so this is an
    // expected signal, not a failure: swallow it and return what was already recorded. Anything else
    // is a real failure and re-throws.
    if ((e as { name?: string })?.name !== "TrustchainOutdated") throw e;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Merging synced accounts into the local wallet-cli session (pure — unit-testable)
// ---------------------------------------------------------------------------

type ImportedEntry = { status: "imported"; label: string; network: string };
type UnchangedEntry = { status: "unchanged"; label: string; network: string };
type SkippedEntry = { status: "skipped"; id: string; reason: string };
type InvalidEntry = { status: "invalid"; id: string; reason: string };

export type LedgerSyncImportEntry = ImportedEntry | UnchangedEntry | SkippedEntry | InvalidEntry;

export type LedgerSyncImportReport = {
  imported: ImportedEntry[];
  unchanged: UnchangedEntry[];
  skipped: SkippedEntry[];
  invalid: InvalidEntry[];
};

function emptyReport(): LedgerSyncImportReport {
  return { imported: [], unchanged: [], skipped: [], invalid: [] };
}

function entryId(raw: unknown): string {
  if (typeof raw === "object" && raw !== null && "id" in raw && typeof raw.id === "string") {
    return raw.id;
  }
  return "<unknown>";
}

/**
 * Convert Ledger Sync's raw synced account list into wallet-cli's own AccountDescriptorV1 and
 * merge it idempotently into `session` via `Session.addDescriptor` (deterministic, non-conflicting
 * labels; no duplication on repeat import; never deletes an existing entry — additive only).
 *
 * Each entry is validated and converted independently: a malformed or unsupported entry is reported
 * (`invalid` / `skipped`) without discarding the rest of the import. Mutates `session` in place for
 * every successfully converted entry — callers decide whether/when to `session.write()`.
 */
export function mergeSyncedAccounts(
  session: Session,
  rawAccounts: readonly unknown[],
): LedgerSyncImportReport {
  const report = emptyReport();

  for (const raw of rawAccounts) {
    const parsed = accountDescriptorSchema.safeParse(raw);
    if (!parsed.success) {
      report.invalid.push({
        status: "invalid",
        id: entryId(raw),
        reason: parsed.error.issues.map(i => i.message).join("; "),
      });
      continue;
    }

    const descriptor: AccountDescriptor = parsed.data;
    let v1;
    try {
      v1 = toV1(descriptor as AccountDescriptorV0);
    } catch (e) {
      if (e instanceof UnsupportedFamilyError || e instanceof UnknownNetworkError) {
        report.skipped.push({ status: "skipped", id: descriptor.id, reason: e.message });
      } else {
        report.invalid.push({
          status: "invalid",
          id: descriptor.id,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
      continue;
    }

    // toV1() copies the raw source's seedIdentifier/address verbatim and never itself validates its
    // output — a synced entry with a schema-valid-but-empty seedIdentifier (accountDescriptorSchema's
    // `seedIdentifier` has no `.min(1)`) silently produced a structurally invalid V1 descriptor
    // (e.g. an empty `address`) that looked fine in `session view` but threw on the next `parseV1()`
    // (every later command resolving this account by label). Validate here, once, so that class of
    // entry is isolated as `invalid` instead of corrupting the session.
    const v1Validation = AccountDescriptorV1Schema.safeParse(v1);
    if (!v1Validation.success) {
      report.invalid.push({
        status: "invalid",
        id: descriptor.id,
        reason: v1Validation.error.issues.map(i => i.message).join("; "),
      });
      continue;
    }

    const { label, added } = session.addDescriptor(v1Validation.data);
    const network = serializeNetwork(v1.network);
    if (added) {
      report.imported.push({ status: "imported", label, network });
    } else {
      report.unchanged.push({ status: "unchanged", label, network });
    }
  }

  return report;
}
