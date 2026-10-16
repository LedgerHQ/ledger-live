// Expose only strict necessary coin-module logic to LLD and LLM
export { getSecp256k1Instance, setSecp256k1Instance } from "@ledgerhq/wallet-btc/crypto/secp256k1";
import type { BitcoinOutput, UtxoStrategy } from "./types";

type UTXOStatus =
  | {
      excluded: true;
      reason: "pickPendingUtxo" | "userExclusion";
    }
  | { excluded: false; reason?: undefined };

/** Whether coin selection may pick a UTXO: never a pending one that is not change, nor an excluded one. */
export const getUTXOStatus = (utxo: BitcoinOutput, utxoStrategy: UtxoStrategy): UTXOStatus => {
  if (!utxo.blockHeight && !utxo.isChange) {
    return { excluded: true, reason: "pickPendingUtxo" };
  }
  if (
    utxoStrategy.excludeUTXOs.some(u => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex)
  ) {
    return { excluded: true, reason: "userExclusion" };
  }
  return { excluded: false };
};
