import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/index";
import { VersionedTransaction } from "@solana/web3.js";
import { isRequiredSigner } from "../utils";

export async function craftRawTransaction(
  transaction: string,
  sender?: string,
): Promise<CraftedTransaction> {
  if (!transaction || transaction.trim().length === 0) {
    throw new Error("Empty raw transaction");
  }
  let tx: VersionedTransaction;
  try {
    tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
  } catch {
    throw new Error("Invalid or unsupported raw transaction");
  }

  if (sender && !isRequiredSigner(tx.message, sender)) {
    throw new Error("Sender is not a signer of the transaction");
  }

  return {
    transaction,
    details: {
      recentBlockhash: tx.message.recentBlockhash,
    },
  };
}
