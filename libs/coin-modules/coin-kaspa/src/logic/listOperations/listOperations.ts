import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { getTransactions } from "../../network";
import { transactionToOperation } from "../scanOperations";

const NATIVE_ASSET: AssetInfo = { type: "native", name: "KAS" };

/**
 * Map a legacy `@ledgerhq/types-live` Operation (built by `transactionToOperation`, shared with
 * `scanOperations` so the amount/fee/type computation can't drift between the legacy bridge and
 * the Alpaca API) into the framework Operation shape. This is the single adapter boundary
 * between the two Operation types in this module.
 *
 * Value conventions differ: the legacy `op.value` INCLUDES fees for OUT (amount + fees), whereas
 * the framework `Operation.value` must be the pure amount — the generic coin-module adapter re-adds
 * fees for OUT-family ops when converting back to `@ledgerhq/types-live` (see
 * `ledger-live-common/src/bridge/generic-coin-framework/utils.ts:381-388`). So we strip fees for OUT
 * here to avoid double-counting; IN carries no fee and is forwarded unchanged.
 */
function toFrameworkOperation(op: LegacyOperation): Operation<MemoNotSupported> {
  const fees = BigInt(op.fee?.toFixed(0) ?? "0");
  const legacyValue = BigInt(op.value?.toFixed(0) ?? "0");
  // OUT legacy value = amount + fees; strip fees so the framework's re-add lands on the amount.
  const value = op.type === "OUT" ? legacyValue - fees : legacyValue;

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
