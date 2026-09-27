import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { getTransactions, MAX_PAGE_LIMIT } from "../../network";
import { KaspaTransfer, parseKaspaTransfer } from "./scanOperations";

const NATIVE_ASSET: AssetInfo = { type: "native", name: "KAS" };

/**
 * Map a convention-neutral KaspaTransfer into the framework Operation shape.
 *
 * Alpaca value convention: value = pure amount (fee excluded). The generic coin-module adapter
 * re-adds fees for OUT-family ops when converting back to @ledgerhq/types-live
 * (ledger-live-common/src/bridge/generic-coin-framework/utils.ts:381-388), so stripping them
 * here avoids double-counting. IN carries no fee and is forwarded as-is.
 */
function toFrameworkOperation(t: KaspaTransfer): Operation<MemoNotSupported> {
  const fees = BigInt(t.fee.toFixed(0));
  const value =
    t.type === "OUT"
      ? BigInt(t.netMovement.minus(t.fee).toFixed(0))
      : BigInt(t.netMovement.toFixed(0));

  return {
    id: t.id,
    type: t.type,
    senders: t.senders,
    recipients: t.recipients,
    value,
    asset: NATIVE_ASSET,
    tx: {
      hash: t.id,
      block: {
        height: t.blockHeight,
        hash: t.blockHash,
        time: t.date,
      },
      fees,
      date: t.date,
      failed: false,
    },
  };
}

export function parseCursor(options: ListOperationsOptions): number | undefined {
  let before: number | undefined;
  if (options.cursor) {
    const parsed = Number.parseInt(options.cursor, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      before = parsed;
    }
  }
  return before;
}

/**
 * List native KAS operations for a Kaspa address, one indexer page at a time, newest first.
 * Without a cursor it reads the newest page; the indexer's `X-Next-Page-Before` cursor (surfaced by
 * `network/getTransactions` as `nextPageBefore`) is returned as `next` and fed back as `before`, so
 * each page walks further into the past.
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  // `asc` is not supported. The indexer's `after` mode could walk forward in time, but with
  // minHeight > 0 its first pages hold only operations below minHeight, which come back empty with
  // a cursor — and the generic framework's paginateOperations treats that as the end of history.
  // Honoring `asc` would need minHeight mapped to a block time (an extra block lookup) first.
  if (options.order === "asc") {
    throw new Error("kaspa: listOperations does not support ascending order");
  }

  // The indexer answers 422 for any limit outside 1–MAX_PAGE_LIMIT. `limit` is an upper bound per
  // page, so a larger request is served in MAX_PAGE_LIMIT-sized pages and the rest follows through
  // `next`. A non-positive or fractional value can only be a caller bug.
  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error(`kaspa: listOperations limit must be a positive integer, got ${options.limit}`);
  }
  const limit = options.limit === undefined ? undefined : Math.min(options.limit, MAX_PAGE_LIMIT);

  const before = parseCursor(options);

  const { transactions, nextPageBefore } = await getTransactions(address, { before, limit });
  const pageTransactions = transactions ?? [];
  const addressSet = new Set([address]);
  const { minHeight } = options;

  const items = pageTransactions
    .filter(tx => !minHeight || tx.accepting_block_blue_score >= minHeight)
    .map(tx => toFrameworkOperation(parseKaspaTransfer(tx, addressSet)));

  // Pages come newest first: once a page holds anything below minHeight, every later page is older
  // still, so stop here instead of fetching (and discarding) the next one. The whole page is
  // filtered first, so a late-accepted tx sitting among older ones on this page is still kept.
  const reachedKnownHistory =
    !!minHeight && pageTransactions.some(tx => tx.accepting_block_blue_score < minHeight);

  return {
    items,
    next: reachedKnownHistory ? undefined : (nextPageBefore ?? undefined),
  };
}
