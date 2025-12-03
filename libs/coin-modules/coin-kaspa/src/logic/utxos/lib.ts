import { BigNumber } from "bignumber.js";
import { KaspaUtxo } from "../../types";
import { MASS_PER_INPUT, DEFAULT_MASS_1_OUTPUT, MAX_UTXOS_PER_TX } from "../constants";

export const calcMaxSpendableAmount = (
  utxos: KaspaUtxo[],
  isEcdsaRecipient: boolean,
  feerate: number = 1,
): BigNumber => {
  sortUtxos(utxos);
  const utxoSubset = utxos.slice(0, MAX_UTXOS_PER_TX);
  const maxInputAmount = sumUtxoAmounts(utxoSubset);

  // storage mass can be neglected here
  // max compute mass for one output and 88 inputs is 98901
  let maxSpendableAmount = maxInputAmount.minus(
    BigNumber(DEFAULT_MASS_1_OUTPUT + utxoSubset.length * MASS_PER_INPUT).times(feerate),
  );

  if (isEcdsaRecipient) {
    maxSpendableAmount = maxSpendableAmount.minus(BigNumber(11));
  }

  return maxSpendableAmount.lt(0) ? BigNumber(0) : maxSpendableAmount;
};

export const sumBigNumber = (values: BigNumber[]): BigNumber => {
  return values.reduce((acc, v) => acc.plus(v), BigNumber(0));
};

export const sumUtxoAmounts = (utxos: KaspaUtxo[]): BigNumber => {
  return utxos.reduce((acc, v) => acc.plus(v.utxoEntry.amount), BigNumber(0));
};

export const sortUtxos = (utxos: KaspaUtxo[]) => {
  utxos.sort((a, b) => {
    const transactionComparison = a.utxoEntry.blockDaaScore.localeCompare(
      b.utxoEntry.blockDaaScore,
    );
    if (transactionComparison !== 0) {
      return transactionComparison;
    }
    return a.utxoEntry.amount.minus(b.utxoEntry.amount).toNumber();
  });
};
