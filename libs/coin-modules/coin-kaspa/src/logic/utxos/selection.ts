import { BigNumber } from "bignumber.js";
import { KaspaUtxo } from "../../types";
import {
  MASS_LIMIT_PER_TX,
  MASS_PER_INPUT,
  MASS_PER_OUTPUT,
  MAX_DISCARD,
  MAX_UTXOS_PER_TX,
} from "../constants";
import { calcComputeMass, calcStorageMass } from "../massCalcluation";
import { calcMaxSpendableAmount, sortUtxos, sumUtxoAmounts } from "./lib";

export const selectUtxos = (
  utxos: KaspaUtxo[],
  isEcdsaRecipient: boolean,
  amount: BigNumber,
  feerate: number = 1,
): { changeAmount: BigNumber; fee: BigNumber; utxos: KaspaUtxo[] } => {
  // always sort utxos
  sortUtxos(utxos);
  // UTXOs are already sorted (FIFO), but need to be sliced, as 88 is the maximum for a transaction.
  const utxoSubset = utxos.slice(0, MAX_UTXOS_PER_TX);

  // Now check in general, if there is enough amount in the UTXOs.
  if (calcMaxSpendableAmount(utxoSubset, isEcdsaRecipient, feerate).isLessThan(amount)) {
    throw new Error(`UTXO total amount is not sufficient for sending amount ${amount}`);
  }

  // Find a sufficient slice.
  for (let i = 0; i < utxoSubset.length; i++) {
    const selectedUtxos = utxoSubset.slice(0, i + 1);
    const selectedUtxoAmount = sumUtxoAmounts(selectedUtxos);
    // calculate absolute min fee for regular TX with 1 outputs and the given feerate.
    const minMass = calcComputeMass(i + 1, false, isEcdsaRecipient);
    const minFee = minMass * feerate;

    // Continue if utxo amount is not enough for transfering amount and fee for miners.
    if (selectedUtxoAmount.isLessThan(amount.plus(minFee))) {
      continue;
    }

    // Here there might be enough UTXOs for the amount + fee.
    // Now the storage mass could be exceeding the TX limit, with having a low change amount value.
    // If yes, add another UTXO.

    // Assuming first, it is a valid TX with change ( 2 outputs )
    const calcFee = feerate * calcComputeMass(i + 1, true, isEcdsaRecipient);
    let changeAmount = selectedUtxoAmount.minus(amount).minus(calcFee);

    const storageMass = changeAmount.isGreaterThan(0)
      ? calcStorageMass(
          selectedUtxos.map(u => u.utxoEntry.amount),
          [amount, changeAmount],
        )
      : 0;

    // If storage mass exceeds the limit or the change amount is negative ( 2 outputs not possible )
    // Need to pick another UTXO or discard the change.
    if (changeAmount.isLessThan(0) || storageMass > MASS_LIMIT_PER_TX) {
      // Picking a further UTXO means a higher mass (one input and output) and thus a higher fee.
      // Check if the fee is not higher, than just discarding the change.
      const isWorthPickingAnotherUtxo = changeAmount.isGreaterThan(
        BigNumber((MASS_PER_INPUT + MASS_PER_OUTPUT) * feerate),
      );
      if (i + 1 < utxos.length && isWorthPickingAnotherUtxo) {
        // There is one more UTXO and it is cheaper to pick than discard the change.
        continue;
      } else {
        // Change needs to be discarded as fee to keep mass low enough.
        if (changeAmount.isGreaterThan(MAX_DISCARD)) {
          throw new Error(
            `Unable to select UTXOs. Change ${changeAmount} Sompis is too high to be discarded.`,
          );
        }
        changeAmount = BigNumber(0);
      }
    }

    return {
      utxos: selectedUtxos,
      changeAmount,
      fee: selectedUtxoAmount.minus(amount).minus(changeAmount),
    };
  }
  // Throw an error, if UTXOs can't be determined to fulfill the requirement.
  throw new Error("UTXOs can't be determined to fulfill the specified amount");
};
