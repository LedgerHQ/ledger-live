import type { DecryptedTransaction } from "@ledgerhq/zcash-decrypt";
import type { RawTransaction } from "./jsonRpcClient";
import type { ShieldedTransaction } from "./types";

export const toShieldedTransaction = (
  tx: RawTransaction,
  decryptedTx: DecryptedTransaction,
): ShieldedTransaction => ({
  id: tx.txid,
  hex: tx.hex,
  blockHash: tx.blockhash,
  blockHeight: tx.height,
  timestamp: tx.time,
  fee: tx.orchard.valueBalance,
  decryptedData: decryptedTx,
});
