import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
import { VersionedTransaction } from "@solana/web3.js";

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

  const feePayer = tx.message.staticAccountKeys[0]?.toBase58();
  if (sender && feePayer && sender !== feePayer) {
    throw new Error("Sender does not match transaction fee payer");
  }

  return {
    transaction,
    details: {
      recentBlockhash: tx.message.recentBlockhash,
    },
  };
}
