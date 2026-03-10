import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
import { VersionedTransaction } from "@solana/web3.js";
import type { ChainAPI } from "../network";

export async function craftRawTransaction(
  _api: ChainAPI,
  transaction: string,
  sender: string,
  _publicKey: string,
  _sequence: bigint,
): Promise<CraftedTransaction> {
  const tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));

  const feePayer = tx.message.staticAccountKeys[0];
  if (!feePayer || feePayer.toBase58() !== sender) {
    throw new Error("Sender address does not match the transaction fee payer");
  }

  return {
    transaction,
    details: {
      recentBlockhash: tx.message.recentBlockhash,
    },
  };
}
