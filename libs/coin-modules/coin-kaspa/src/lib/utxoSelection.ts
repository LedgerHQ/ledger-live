import { BigNumber } from "bignumber.js";
import { KaspaUtxo } from "../types/kaspaNetwork";
import { selectUtxosFIFO } from "./utxoSelection/fifo";

const MAX_TX_INPUTS = 88; // floor (( 100_000 - 918 (def_size) ) / 1_118 (per_input))
const MASS_PER_UTXO_INPUT = 1_118;
const DEFAULT_MASS_WITHOUT_INPUT = 918;

const FEE_RATE_THRESHOLD = 1; // strategy decision based on fee rate threshold

// if one output is ECDSA, scriptPubKey is one byte longer
// which ends up in 11g mass ( 1 byte + 10g MASS_PER_SCRIPT_PUB_KEY_BYTE )
const ADDTIONAL_MASS_FOR_ECDSA_OUTPUT = 11;

export enum UtxoStrategy {
  FIFO = "FIFO", // First In, First Out
  LIFO = "LIFO", // Last In, First Out
  HIFO = "HIFO", // Highest In, First Out
}

export function selectUtxos(
  utxos: KaspaUtxo[],
  utxoSelectingStrategy: UtxoStrategy,
  isEcdsaRecipient: boolean,
  amount: BigNumber,
  feerate: number = 1,
): { changeAmount: BigNumber; fee: BigNumber; utxos: KaspaUtxo[] } {
  switch (utxoSelectingStrategy) {
    case UtxoStrategy.FIFO:
      return selectUtxosFIFO(utxos, isEcdsaRecipient, amount, feerate);
    default:
      throw new Error("Utxo selection strategy not implemented yet");
  }
}
