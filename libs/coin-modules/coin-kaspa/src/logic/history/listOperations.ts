import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { getAllTransactions } from "./getAllTransactions";
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

export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const allTransactions = await getAllTransactions(address, 1);
  const addressSet = new Set([address]);

  const items = allTransactions
    .filter(tx => !options.minHeight || tx.accepting_block_blue_score >= options.minHeight)
    .map(tx => toFrameworkOperation(parseKaspaTransfer(tx, addressSet)));

  return {
    items,
    next: undefined,
  };
}
