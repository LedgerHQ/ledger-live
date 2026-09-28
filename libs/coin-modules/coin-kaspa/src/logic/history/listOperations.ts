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

// A block carrying a valid tx can be merged into the BlockDAG up to ~1 h after its own timestamp, so
// that tx gets a higher accepting blue score than txs with newer block times. The legacy bridge
// covers it by rescanning 2 h before the last sync (bridge/synchronization.ts); the same window is
// applied here, counted back from the newest already-synced tx the walk has seen.
export const LATE_ACCEPTANCE_WINDOW_MS = 2 * 60 * 60 * 1000;

// The cursor is `<before>` or `<before>:<anchor>`: the indexer's X-Next-Page-Before block time, and
// the block time of the newest already-synced tx seen so far (the start of the lookback window).
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

export function parseAnchor(options: ListOperationsOptions): number | undefined {
  const [, anchor] = (options.cursor ?? "").split(":");
  const parsed = Number.parseInt(anchor ?? "", 10);
  return Number.isNaN(parsed) || parsed < 1 ? undefined : parsed;
}

/**
 * List native KAS operations for a Kaspa address, newest first. Without a cursor it reads the newest
 * indexer page; the indexer's `X-Next-Page-Before` cursor (surfaced by `network/getTransactions` as
 * `nextPageBefore`) is returned in `next` and fed back as `before`, so each call walks further into
 * the past.
 *
 * With `minHeight`, the walk stops once it is LATE_ACCEPTANCE_WINDOW_MS older than the newest
 * already-synced tx: anything older was accepted before that tx, hence below `minHeight`.
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

  const { minHeight } = options;
  const addressSet = new Set([address]);
  const items: Operation<MemoNotSupported>[] = [];
  let before = parseCursor(options);
  let anchor = parseAnchor(options);

  for (;;) {
    const { transactions, nextPageBefore } = await getTransactions(address, { before, limit });
    const page = transactions ?? [];

    // The whole page is filtered, so a late-accepted tx sitting among older ones is still kept.
    for (const tx of page) {
      if (!minHeight || tx.accepting_block_blue_score >= minHeight) {
        items.push(toFrameworkOperation(parseKaspaTransfer(tx, addressSet)));
      } else if (anchor === undefined || tx.block_time > anchor) {
        anchor = tx.block_time;
      }
    }

    // Full sync: nothing is known yet, so every page is new — pass the indexer's cursor through.
    if (!minHeight) {
      return { items, next: nextPageBefore ?? undefined };
    }

    const oldestBlockTime = Math.min(...page.map(tx => tx.block_time));
    const pastLookback =
      anchor !== undefined && oldestBlockTime <= anchor - LATE_ACCEPTANCE_WINDOW_MS;
    if (!nextPageBefore || page.length === 0 || pastLookback) {
      return { items, next: undefined };
    }

    const next = anchor === undefined ? nextPageBefore : `${nextPageBefore}:${anchor}`;
    // Inside the lookback window pages are often all already-synced. An empty page that still has a
    // cursor ends generic-coin-framework's paginateOperations walk, so keep reading here until there
    // is something to return or the window is behind us.
    if (items.length > 0) {
      return { items, next };
    }
    before = Number.parseInt(nextPageBefore, 10);
  }
}
