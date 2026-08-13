import type {
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { transactionToHex } from "@stacks/transactions";
import type { StacksTxData } from "../../types";
import { getNextSequence } from "../account/getNextSequence";
import { buildUnsignedTx } from "./buildUnsignedTx";
import { estimateFees } from "./estimateFees";

export async function craftTransaction(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const nonce = intent.sequence ?? (await getNextSequence(intent.sender));
  const fee = customFees?.value ?? (await estimateFees(intent)).value;

  const tx = await buildUnsignedTx(intent, fee, nonce);

  return { transaction: transactionToHex(tx) };
}
