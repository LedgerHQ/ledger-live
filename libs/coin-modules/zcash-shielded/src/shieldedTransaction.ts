import { DecryptedTransaction } from "@ledgerhq/zcash-decrypt";
import { RawTransaction } from "./jsonRpcClient";

export type ShieldedTransaction = {
  id: string;
  hex: string;
  height: number;
  blockHash: string;
  time: number;
  fee: number; // BigNumber as string
  decryptedData?: DecryptedTransaction; // Decrypted transaction data
};

export const toShieldedTransaction = (
  tx: RawTransaction,
  decryptedTx: DecryptedTransaction,
): ShieldedTransaction => ({
  id: tx.txid,
  hex: tx.hex,
  height: tx.height,
  blockHash: tx.blockhash,
  time: tx.time,
  fee: tx.orchard.valueBalance,
  decryptedData: decryptedTx,
});
