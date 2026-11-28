import type { BlockTransaction } from "@ledgerhq/coin-module-framework/api/index";
import type { RawOperation } from "../types";

const DIRECTION = { IN: 1n, OUT: -1n, FEES: 0n };

/** What `listOperations` says a native transaction did to the account. */
export const listedEffect = (op: RawOperation) => ({
  moved: DIRECTION[op.type] * BigInt(op.amount),
  fees: BigInt(op.transactionFee),
  feesPayer: op.feesPayer,
  failed: op.failed,
});

/** What `getBlock` says the same transaction did to the same account. */
export const blockEffect = (tx: BlockTransaction, account: string) => ({
  moved: tx.operations.reduce(
    (sum, op) => (op.type === "transfer" && op.address === account ? sum + op.amount : sum),
    0n,
  ),
  fees: tx.fees,
  feesPayer: tx.feesPayer,
  failed: tx.failed,
});
