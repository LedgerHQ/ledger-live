import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  CloudSyncSDK,
  type UpdateEvent,
  type Trustchain,
  type MemberCredentials,
  type TrustchainSDK,
} from "@shared/cloud-sync";
import { errMessage } from "../shared/error-message";
import { CLOUD_SYNC_API_URLS, type LedgerSyncEnvironment } from "../key-ring/constants";
import {
  toV1,
  serializeNetwork,
  UnsupportedFamilyError,
  UnknownNetworkError,
  AccountDescriptorV1Schema,
  AccountDescriptorV0Schema,
  type AccountDescriptorV0,
  type AccountDescriptorV1,
} from "../shared/accountDescriptor";
import { SUPPORTED_TRANSACTION_FAMILIES } from "../wallet/intents";
import { Session } from "../session/session-store";

/** Ledger Sync's Cloud Sync "slug" for the account-list document — matches Desktop/Mobile's
 * `liveSlug` (see docs/ledger-sync/04-cloud-sync-sdk.md and useWatchWalletSync.ts). */
const LIVE_SLUG = "live";

// ---------------------------------------------------------------------------
// Pulling the raw synced document (network + auth)
// ---------------------------------------------------------------------------

type CloudSyncSdkOptions = ConstructorParameters<typeof CloudSyncSDK<Record<string, unknown>>>[0];

/** The part of `CloudSyncSDK` a pull needs; injectable so the pull logic is testable offline. */
export type CreateCloudSyncSdk = (options: CloudSyncSdkOptions) => {
  pull: (trustchain: Trustchain, memberCredentials: MemberCredentials) => Promise<unknown>;
};

const createCloudSyncSdk: CreateCloudSyncSdk = options => new CloudSyncSDK(options);

export type PullResult =
  | { status: "new-data"; accounts: unknown[]; version: number }
  | { status: "malformed"; reason: string }
  | { status: "up-to-date" }
  | { status: "deleted" };

/**
 * Pull the Ledger Sync account-list document for the given trustchain/member. Read-only: this
 * never pushes wallet-cli-local accounts back to Ledger Sync.
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
  createSdk: CreateCloudSyncSdk = createCloudSyncSdk,
): Promise<PullResult> {
  let result: PullResult = { status: "up-to-date" };

  const saveNewUpdate = async (event: UpdateEvent<Record<string, unknown>>): Promise<void> => {
    if (event.type === "deleted-data") {
      result = { status: "deleted" };
      return;
    }
    const rawAccounts = event.data.accounts;
    // Not an empty list: reporting it as `new-data` would let `import` cache this version and
    // treat every later pull as up to date, so the accounts would never come back once fixed.
    result = Array.isArray(rawAccounts)
      ? { status: "new-data", accounts: rawAccounts, version: event.version }
      : { status: "malformed", reason: "the synced document has no `accounts` list" };
  };

  const sdk = createSdk({
    apiBaseUrl: CLOUD_SYNC_API_URLS[environment],
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

// wallet-cli only knows how to build send intents for these families (see
// `wallet/intents/families/*.ts`) — anything else converts to a valid AccountDescriptorV1 just fine
// (toV1() only fails for a currency the derivation-mode registry itself can't resolve, which is a
// much smaller set) but would be unusable the moment any other command tried to act on it.
const SUPPORTED_FAMILIES = new Set<string>(SUPPORTED_TRANSACTION_FAMILIES);

function issues(error: { issues: ReadonlyArray<{ message: string }> }): string {
  return error.issues.map(i => i.message).join("; ");
}

/** The family name when wallet-cli can't act on this currency, else undefined (including for an
 * unresolvable currencyId, which toV1() classifies instead). */
function unsupportedFamily(currencyId: string): string | undefined {
  let family: string;
  try {
    family = getCryptoCurrencyById(currencyId).family;
  } catch {
    return undefined;
  }
  return SUPPORTED_FAMILIES.has(family) ? undefined : family;
}

/** Validates and converts one synced entry, isolating any failure to that entry. */
function convertSyncedAccount(
  raw: unknown,
): SkippedEntry | InvalidEntry | { status: "converted"; descriptor: AccountDescriptorV1 } {
  const parsed = AccountDescriptorV0Schema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid", id: entryId(raw), reason: issues(parsed.error) };
  }
  const descriptor: AccountDescriptorV0 = parsed.data;

  // Checked before toV1() rather than relying on it to throw: toV1() only fails for a currency the
  // derivation-mode registry can't resolve at all, not for one wallet-cli simply has no
  // transaction-family support for (e.g. Cardano/Polkadot/Tezos convert to a perfectly valid
  // AccountDescriptorV1 and would otherwise be silently `imported`).
  const family = unsupportedFamily(descriptor.currencyId);
  if (family) {
    return {
      status: "skipped",
      id: descriptor.id,
      reason:
        `Currency family "${family}" is not supported by wallet-cli (supported: ` +
        `${[...SUPPORTED_FAMILIES].join(", ")}).`,
    };
  }

  let v1: unknown;
  try {
    v1 = toV1(descriptor);
  } catch (e) {
    return e instanceof UnsupportedFamilyError || e instanceof UnknownNetworkError
      ? { status: "skipped", id: descriptor.id, reason: e.message }
      : { status: "invalid", id: descriptor.id, reason: errMessage(e) };
  }

  // toV1() copies the raw source's seedIdentifier/address verbatim and never itself validates its
  // output — a synced entry with a schema-valid-but-empty seedIdentifier (accountDescriptorSchema's
  // `seedIdentifier` has no `.min(1)`) silently produced a structurally invalid V1 descriptor (e.g.
  // an empty `address`) that looked fine in `session view` but threw on the next `parseV1()`.
  // Validate here, once, so that class of entry is isolated as `invalid` instead of corrupting the
  // session.
  const validated = AccountDescriptorV1Schema.safeParse(v1);
  if (!validated.success) {
    return { status: "invalid", id: descriptor.id, reason: issues(validated.error) };
  }
  return { status: "converted", descriptor: validated.data };
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
    const converted = convertSyncedAccount(raw);
    if (converted.status === "skipped") {
      report.skipped.push(converted);
    } else if (converted.status === "invalid") {
      report.invalid.push(converted);
    } else {
      const { label, added } = session.addDescriptor(converted.descriptor);
      const network = serializeNetwork(converted.descriptor.network);
      if (added) report.imported.push({ status: "imported", label, network });
      else report.unchanged.push({ status: "unchanged", label, network });
    }
  }

  return report;
}
