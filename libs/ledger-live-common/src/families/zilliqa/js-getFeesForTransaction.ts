import { ZILLIQA_TX_GAS_LIMIT, getMinimumGasPrice } from "./api";
import type { ZilliqaAccount, Transaction } from "./types";
import { BigNumber } from "bignumber.js";
import { BN } from "@zilliqa-js/util";

export const getEstimatedFees = async ({}: /*
  a,
  t,
  */
{
  a: ZilliqaAccount;
  t: Transaction;
}): Promise<BigNumber> => {
  const gasPrice = await getMinimumGasPrice();
  const gasLimit = new BN(ZILLIQA_TX_GAS_LIMIT);
  return new BigNumber(gasPrice.mul(gasLimit).toString());
};

export default getEstimatedFees;
