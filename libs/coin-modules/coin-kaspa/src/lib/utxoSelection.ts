import { KaspaUtxo } from "../types/bridge";
import { BigNumber } from "bignumber.js";

const MAX_TX_INPUTS = 88; // floor (( 100_000 - 918 (def_size) ) / 1_118 (per_input))
const MASS_PER_UTXO_INPUT = 1_118;
const DEFAULT_MASS_WITHOUT_INPUT = 918;

const FEE_RATE_THRESHOLD = 1; // strategy decision based on fee rate threshold

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

  utxos.sort((a, b) => a.utxoEntry.amount.minus(b.utxoEntry.amount).toNumber());

  // check if  utxo set is valid
  const spendableUtxos = calculateUtxoSumInRange(
    utxos,
    Math.max(0, utxos.length - MAX_TX_INPUTS),
    utxos.length,
  );
  const maximumMass =
    DEFAULT_MASS_WITHOUT_INPUT + Math.min(MAX_TX_INPUTS, utxos.length) * MASS_PER_UTXO_INPUT;
  const maximumSpendableAmount = spendableUtxos.minus(maximumMass * feerate);

  if (amount.gt(maximumSpendableAmount)) {
    throw Error(`Amount too high for this utxo set. Only ${MAX_TX_INPUTS} inputs are allowed.`);
  }

  let txDefaultMass = DEFAULT_MASS_WITHOUT_INPUT;
  if (recipient_is_ecdsa) {
    txDefaultMass += ADDTIONAL_MASS_FOR_ECDSA_OUTPUT;
  }

  let from: number = 0;
  let to: number = 0;

  // fee is low, time to compound small utxos
  // from smallest to biggest UTXOs
  if (feerate <= FEE_RATE_THRESHOLD) {
    let amountNeededWithFees: BigNumber = amount;

    do {
      if (to - from === MAX_TX_INPUTS) {
        from++;
      }
      to++;

      amountNeededWithFees = amount.plus(
        BigNumber(((to - from) * MASS_PER_UTXO_INPUT + txDefaultMass) * feerate),
      );
    } while (calculateUtxoSumInRange(utxos, from, to).lt(amountNeededWithFees));
  }
  // fee is higher
  // use as few UTXOs as possible
  if (feerate > FEE_RATE_THRESHOLD) {
    from = utxos.length;
    to = utxos.length;
    let amountNeededWithFees: BigNumber = amount;

    // first check utxo amount needed
    do {
      from--;
      amountNeededWithFees = amount.plus(
        BigNumber(((to - from) * MASS_PER_UTXO_INPUT + txDefaultMass) * feerate),
      );
    } while (calculateUtxoSumInRange(utxos, from, to).lt(amountNeededWithFees));

    // from and to parameters are now set
    // now shift to smaller UTXO amounts if possible
    while (from > 0 && calculateUtxoSumInRange(utxos, from - 1, to - 1).gte(amountNeededWithFees)) {
      from--;
      to--;
    }
  }
  return utxos.slice(from, to);
}

function calculateUtxoSumInRange(utxos: KaspaUtxo[], from: number, to: number): BigNumber {
  if (from > to) {
    throw new Error("'from' index must be less than 'to' index");
  }

  let sum = BigNumber(0);
  for (let i = from; i < to; i++) {
    try {
      sum = sum.plus(utxos[i].utxoEntry.amount);
    } catch (e) {
      // just ignore e..
    }
  }
  return sum;
}
