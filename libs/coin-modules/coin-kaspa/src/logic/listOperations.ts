import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { getTransactions } from "../network";
import { transactionToOperation } from "./scanOperations";

const NATIVE_ASSET: AssetInfo = { type: "native", name: "KAS" };

/**
 * Map a legacy `@ledgerhq/types-live` Operation (built by `transactionToOperation`, shared with
 * `scanOperations` so the amount/fee/type computation can't drift between the legacy bridge and
 * the Alpaca API) into the framework Operation shape. This is the single adapter boundary
 * between the two Operation types in this module.
 *
 * `legacyOperation.value` already equals amount + fees for OUT operations (see
 * `transactionToOperation`), so it is used as-is here.
 */
function toFrameworkOperation(op: LegacyOperation): Operation<MemoNotSupported> {
  const fees = BigInt(op.fee?.toFixed(0) ?? "0");
  const value = BigInt(op.value?.toFixed(0) ?? "0");

  return {
    id: op.id,
    type: op.type,
    senders: op.senders ?? [],
    recipients: op.recipients ?? [],
    value,
    asset: NATIVE_ASSET,
    tx: {
      hash: op.hash,
      block: {
        height: op.blockHeight ?? 0,
        hash: op.blockHash ?? "",
        time: op.date,
      },
      fees,
      date: op.date,
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
  return options.minHeight > 0 ? options.minHeight : 1;
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
    .map(tx => toFrameworkOperation(transactionToOperation(tx, addressSet, address)));

  return {
    items,
    next: nextPageAfter ?? undefined,
  };
}
