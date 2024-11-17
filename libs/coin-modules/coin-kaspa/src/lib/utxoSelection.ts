import { KaspaUtxo } from "../types/bridge";
import { BigNumber } from "bignumber.js";

const MAX_TX_MASS = 100_000;
const MASS_PER_UTXO_INPUT = 1_118;
const DEFAULT_MASS_WITHOUT_INPUT = 918;

// if one output is ECDSA, scriptPubKey is one byte longer
// which ends up in 11g mass ( 1 byte + 10g MASS_PER_SCRIPT_PUB_KEY_BYTE )
const ADDTIONAL_MASS_FOR_ECDSA_OUTPUT = 11;

export function selectUtxos(
  utxos: KaspaUtxo[],
  recipient_is_ecdsa: boolean,
  amount: BigNumber,
  feerate: number = 1,
): KaspaUtxo[] {
  /*
  - minimum fee depends on mass
  - assume input addresses are always Schnorr
  - TX mass with 1 input and two outputs (Schnorr) is 2036g
   
  - per additional input UTXO in the transaction it is 1118g mass.
  
  - maximum allowed mass in a regular node is 100_000
  
  Two strategies are implemented.
    minimum fees -> time to compound utxos
    higher fees -> as less inputs as needed
  */

  if (feerate === 1) {
    // fee is low, time to compound small utxos
    // sort utxos ascending
    utxos.sort((a, b) => a.utxoEntry.amount.minus(b.utxoEntry.amount).toNumber());
  } else {
    // fees are higher
    // sort utxos descending
    utxos.sort((a, b) => b.utxoEntry.amount.minus(a.utxoEntry.amount).toNumber());
  }

  const selectedUtxos: KaspaUtxo[] = [];
  let txTotalInput = BigNumber(0);
  let txMass = DEFAULT_MASS_WITHOUT_INPUT;

  if (recipient_is_ecdsa) {
    txMass += ADDTIONAL_MASS_FOR_ECDSA_OUTPUT;
  }

  // Iterate through the UTXOs and select them until the total amount is reached
  for (const utxo of utxos) {
    // Calculate the mass when adding this UTXO
    txMass += MASS_PER_UTXO_INPUT;

    selectedUtxos.push(utxo);
    txTotalInput = txTotalInput.plus(utxo.utxoEntry.amount);

    // Check if the amount goal has been reached
    if (txTotalInput.gte(amount.plus(txMass * feerate))) {
      break;
    }
  }

  if (txTotalInput.lt(amount.plus(txMass * feerate))) {
    throw Error("Amount too high for inputs.");
  }

  console.log("mass", txMass)

  return selectedUtxos;
}
