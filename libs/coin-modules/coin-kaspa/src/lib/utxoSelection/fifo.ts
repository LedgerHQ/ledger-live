import { KaspaUtxo } from "../../types";
import { BigNumber } from "bignumber.js";
import { calcComputeMass } from "../massCalcluation";
import { calculateChangeAmount } from "./lib";

// important: define threshold of change address, where storage mass never exceeds 100_000!
// in this case outputs of [2000_0000, 2000_0000]
const DEFAULT_MASS_1_OUTPUT: number = 506;
const MASS_PER_INPUT: number = 1118;
const MAX_UTXOS_PER_TX: number = 88;

export const selectUtxosFIFO = (
  utxos: KaspaUtxo[],
  isEcdsaRecipient: boolean,
  amount: BigNumber,
  feerate: number = 1,
): { changeAmount: BigNumber; fee: BigNumber; utxos: KaspaUtxo[] } => {
  // sort with blockDaaScore ASCENDING for FIFO
  utxos.sort((a, b) => parseInt(a.utxoEntry.blockDaaScore) - parseInt(b.utxoEntry.blockDaaScore));

  checkMaxSpendableAmountValidity(utxos.slice(0, 88), amount, isEcdsaRecipient);
  // we have enough UTXOs for this strategy - find the right slice
  // no need to use all of them.
  let combinedAmount = new BigNumber(0);

  for (let i = 0; i < utxos.length; i++) {
    combinedAmount = combinedAmount.plus(BigNumber(utxos[i].utxoEntry.amount));

    const minFee = calcComputeMass(i + 1, false, false) * feerate;
    if (combinedAmount.isGreaterThanOrEqualTo(amount.plus(minFee))) {
      // here we might have enough UTXOs for the amount + computeMass
      // now the storageMass could be very high, with a low change amount, maybe another UTXO is needed.
      try {
        const { changeAmount, fee } = calculateChangeAmount(
          utxos.slice(0, i + 1).map(u => u.utxoEntry.amount),
          amount,
          feerate,
        );

        // if calculateChangeAmount worked, the utxo set works:
        return {
          utxos: utxos.slice(0, i + 1),
          changeAmount,
          fee,
        };
      } catch {
        // calculateChangeAmount didn't work. Another UTXO needed - continue
        continue;
      }
    }
  }
  // throw error UTXOs can't be determined if no UTXOs are found to fulfill the requirement
  throw new Error("UTXOs can't be determined to fulfill the specified amount");
};

function checkMaxSpendableAmountValidity(
  utxos: KaspaUtxo[],
  amount: BigNumber,
  isEcdsaRecipient: boolean,
): BigNumber {
  // first check if this strategy is really working for this amount
  const maxInputAmount = utxos
    .slice(0, MAX_UTXOS_PER_TX)
    .reduce((sum, utxo) => sum.plus(new BigNumber(utxo.utxoEntry.amount)), new BigNumber(0));

  //  storage mass can be neglected here
  // max compute mass for one output and 88 inputs is 98901
  let maxSpendableAmount = maxInputAmount.minus(
    BigNumber(DEFAULT_MASS_1_OUTPUT + Math.min(MAX_UTXOS_PER_TX, utxos.length) * MASS_PER_INPUT),
  );
  if (isEcdsaRecipient) {
    maxSpendableAmount = maxSpendableAmount.minus(BigNumber(11));
  }
  if (amount.isGreaterThan(maxSpendableAmount)) {
    // you want to send more than it's possible
    throw new Error("Insufficient UTXOs to meet the required amount");
  }
  return maxSpendableAmount;
}
