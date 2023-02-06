import { BigNumber } from "bignumber.js";
import { BN } from "@zilliqa-js/util";
import { ZILLIQA_TX_GAS_LIMIT, ZILLIQA_TX_GAS_PRICE } from "./api";

export const estimateMaxSpendable = ({
  account,
  /*parentAccount,*/
  transaction,
}) => {
  let gasPrice: undefined | BN = undefined;
  let gasLimit: undefined | BN = undefined;

  if (transaction && transaction.gasPrice) {
    gasPrice = transaction.gasPrice;
  }

  if (transaction && transaction.gasLimit) {
    gasLimit = transaction.gasLimit;
  }

  if (!gasPrice) {
    gasPrice = new BN(ZILLIQA_TX_GAS_PRICE);
  }

  if (!gasLimit) {
    gasLimit = new BN(ZILLIQA_TX_GAS_LIMIT);
  }

  const estimatedFees = new BigNumber(gasPrice.mul(gasLimit).toString());
  return Promise.resolve(
    BigNumber.max(0, account.balance.minus(estimatedFees))
  );
};
