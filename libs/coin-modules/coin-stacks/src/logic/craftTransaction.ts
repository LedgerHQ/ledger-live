import type {
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { transactionToHex } from "@stacks/transactions";
import type { StacksTxData } from "../types";
import { getNextSequence } from "./getNextSequence";
import { buildUnsignedTx } from "./buildUnsignedTx";
import { estimateFees } from "./estimateFees";

export async function craftTransaction(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const nonce = intent.sequence ?? (await getNextSequence(intent.sender));
  // `sequence: nonce` reuses the nonce just resolved above instead of letting estimateFees
  // re-derive it from scratch: without this, its own `intent.sequence ?? getNextSequence(...)`
  // check sees the same unset `intent.sequence` and issues a second, redundant network lookup.
  const fee = customFees?.value ?? (await estimateFees({ ...intent, sequence: nonce })).value;

  const tx = await buildUnsignedTx(intent, fee, nonce);

  return { transaction: transactionToHex(tx) };
}
