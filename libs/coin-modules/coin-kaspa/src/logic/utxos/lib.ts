import { BigNumber } from "bignumber.js";
import { KaspaUtxo } from "../../types";

const ADDITIONAL_MASS_PER_INPUT = 1118;

const DEFAULT_MASS_1_OUTPUT: number = 506;
const MAX_UTXOS_PER_TX: number = 88;

export const calcMaxSpendableAmount = (
  utxos: KaspaUtxo[],
  isEcdsaRecipient: boolean,
  feerate: number = 1,
): BigNumber => {
  const maxInputAmount = utxos.reduce(
    (sum, utxo) => sum.plus(new BigNumber(utxo.utxoEntry.amount)),
    new BigNumber(0),
  );

  // storage mass can be neglected here
  // max compute mass for one output and 88 inputs is 98901
  let maxSpendableAmount = maxInputAmount.minus(
    BigNumber(
      DEFAULT_MASS_1_OUTPUT + Math.min(MAX_UTXOS_PER_TX, utxos.length) * ADDITIONAL_MASS_PER_INPUT,
    ).times(feerate),
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
