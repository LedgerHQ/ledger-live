import type { AccountBalance } from "@domain/entity-account-balance";
import type {
  AccountDataSource,
  AccountRef,
  AccountSlice,
  FetchRequest,
  SliceUpdate,
} from "../port";

/** What one legacy full sync produced, projected onto the slices that exist today. */
export type LegacySyncResult = {
  /** The account's balance plus one row per token account — `toAccountBalances`' output. */
  balances: AccountBalance[];
};

export type LegacyBridgePort = {
  /** Whether a legacy bridge exists for this account. Normally true for every registered family. */
  supports(ref: AccountRef): boolean;
  /**
   * Run today's full `AccountBridge.sync()` and project its result.
   *
   * Deliberately not incremental: the legacy contract hands back a whole `Account` or nothing, and
   * pretending otherwise here would hide the cost rather than remove it.
   */
  sync(ref: AccountRef, signal?: AbortSignal): Promise<LegacySyncResult>;
};

export const LEGACY_BRIDGE_SOURCE_ID = "legacy-bridge";

const NO_CAPABILITIES: ReadonlySet<AccountSlice> = new Set();
const BALANCE_DELIVERY: ReadonlySet<AccountSlice> = new Set<AccountSlice>(["balance"]);

/**
 * The compatibility half: everything that exists today, behind the port.
 *
 * `capabilities` is empty and that is the design, not an omission. This source can produce any
 * slice, but never *independently* — one run pays the whole network cost of a full account sync. An
 * empty capability set means the router never *selects* it for a slice; it only ever covers what no
 * cheaper source could. `deliveries` is what it actually emits, which is how the router knows a
 * single sync already satisfies several wants at once.
 *
 * Lowest priority for the same reason. As families gain granular capabilities this source stops
 * being reached for them, one family at a time, with no UI change — and when the last one is
 * migrated it can be unregistered and deleted.
 */
export function createLegacyBridgeSource(
  port: LegacyBridgePort,
  { priority = 0 }: { priority?: number } = {},
): AccountDataSource {
  return {
    id: LEGACY_BRIDGE_SOURCE_ID,
    priority,

    // Token refs excluded for the same reason as on the granular source: this source projects the
    // *parent* account's balances, and emitting them under a token id would make
    // `replaceAccountBalances` diff against rows the token account does not own.
    supports: ref => !ref.parentId && port.supports(ref),

    capabilities: () => NO_CAPABILITIES,

    // Only `balance` today: this is what the source really emits, and declaring slices it cannot
    // produce yet would let the router hand it work it would silently drop. Each new slice added to
    // `LegacySyncResult` is added here in the same change.
    deliveries: ref => (ref.parentId ? NO_CAPABILITIES : BALANCE_DELIVERY),

    async *fetch({ ref, signal }: FetchRequest): AsyncIterable<SliceUpdate> {
      const { balances } = await port.sync(ref, signal);
      yield { slice: "balance", accountId: ref.accountId, balances };
    },
  };
}
