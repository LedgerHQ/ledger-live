import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import type { VechainContext, VechainCurrencyConfig } from "../../config";
import { getLastBlockHeight, getOperations, getTokenOperations } from "../../network";
import { getTransactionFee, type TransactionFee } from "../../network/getFees";
import { NATIVE_ASSET, VTHO_ASSET, vthoAsset } from "../account/getBalance";

/** One receipt per transaction, shared by the VET and VTHO rows of this call. */
function transactionFeeReader(config: VechainCurrencyConfig) {
  const fees = new Map<string, Promise<TransactionFee>>();
  return (transactionId: string): Promise<TransactionFee> => {
    let fee = fees.get(transactionId);
    if (!fee) {
      fee = getTransactionFee(config, transactionId);
      fees.set(transactionId, fee);
    }
    return fee;
  };
}

/**
 * Every operation of a transaction carries its fee: VTHO, from the receipt's payer, also when the
 * operation is VET or the account did not pay it. A consumer debits it once, from the payer.
 */
function toFrameworkOperation(
  op: LegacyOperation,
  asset: AssetInfo,
  { paid, payer }: TransactionFee,
): Operation<MemoNotSupported> {
  return {
    id: op.id,
    type: op.type,
    senders: op.senders,
    recipients: op.recipients,
    value: BigInt(op.value.toFixed(0)),
    asset,
    details: { ledgerOpType: op.type },
    tx: {
      hash: op.hash,
      block: { height: op.blockHeight ?? 0, hash: op.blockHash ?? "", time: op.date },
      fees: BigInt(paid.toFixed(0)),
      feesAsset: { ...VTHO_ASSET },
      ...(payer === undefined ? {} : { feesPayer: payer }),
      date: op.date,
      failed: op.hasFailed ?? false,
    },
  };
}

function parseCursor(options: ListOperationsOptions): number {
  const parsed = options.cursor ? Number.parseInt(options.cursor, 10) : Number.NaN;
  const fromCursor = !Number.isNaN(parsed) && parsed >= 1 ? parsed : 1;
  return Math.max(fromCursor, options.minHeight || 0);
}

// Merged VET + VTHO operations. A page is never partial: getOperations/getTokenOperations exhaust
// [startAt, head] within this call (splitting the block range until the node accepts it), so there
// is no next page to advertise and `next` stays unset — a cursor on a complete (or empty) page traps
// a client that pages until `next` is falsy. Resume across syncs is driven by `minHeight`.
export async function listOperations(
  context: VechainContext,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const config = await context.config();
  const startAt = parseCursor(options);
  const stopAt = await getLastBlockHeight(config);

  if (startAt > stopAt) {
    return { items: [] };
  }

  const readFee = transactionFeeReader(config);
  const readPaid = async (transactionId: string) => (await readFee(transactionId)).paid;
  const [vetOps, vthoOps] = await Promise.all([
    getOperations(config, address, address, startAt, stopAt, readPaid),
    getTokenOperations(config, address, address, VTHO_ADDRESS, startAt, stopAt, readPaid),
  ]);

  const withFee = (ops: LegacyOperation[], asset: AssetInfo) =>
    Promise.all(ops.map(async op => toFrameworkOperation(op, asset, await readFee(op.hash))));
  const [vetItems, vthoItems] = await Promise.all([
    withFee(vetOps, NATIVE_ASSET),
    withFee(vthoOps, vthoAsset(address)),
  ]);

  const items = [...vetItems, ...vthoItems].sort((a, b) =>
    options.order === "asc"
      ? a.tx.date.getTime() - b.tx.date.getTime()
      : b.tx.date.getTime() - a.tx.date.getTime(),
  );

  return { items };
}
