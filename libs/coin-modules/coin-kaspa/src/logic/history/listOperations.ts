import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { getTransactions } from "../../network";
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

function parseCursor(options: ListOperationsOptions): number {
  if (options.cursor) {
    const parsed = Number.parseInt(options.cursor, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return 1;
}

/**
 * List native KAS operations for a Kaspa address, one indexer page at a time. The indexer's
 * opaque `X-Next-Page-After` cursor (surfaced by `network/getTransactions` as `nextPageAfter`)
 * is always propagated as the returned page's `next` cursor — it must never be hardcoded to
 * `undefined`, or synchronization would silently stop after the first page whenever more
 * transactions are available.
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const after = parseCursor(options);

  const { transactions, nextPageAfter } = await getTransactions(address, after);
  const addressSet = new Set([address]);

  const items = (transactions ?? [])
    .filter(tx => !options.minHeight || tx.accepting_block_blue_score >= options.minHeight)
    .map(tx => toFrameworkOperation(parseKaspaTransfer(tx, addressSet)));

  return {
    items,
    next: nextPageAfter ?? undefined,
  };
}
