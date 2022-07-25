import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import { getFees } from "./api";
import type { Transaction } from "./types";

/**
 *
 * @param a account
 * @param t transaction
 * @returns estimated fees
 */
const getTransactionFee = async (
  a: Account,
  t: Transaction
): Promise<{
  dc: BigNumber;
  estHnt: BigNumber;
}> => {
  switch (t.model.mode) {
    case "send":
      return await getFees("payment_v2", a.currency);
    case "stake":
      return await getFees("stake_v1", a.currency);
    case "unstake":
      return await getFees("unstake_v1", a.currency);
    case "transfer":
      return await getFees("transfer_stake_v1", a.currency);
    case "burn":
      return await getFees("token_burn_v1", a.currency);
    default:
      return await getFees("payment_v2", a.currency);
  }
};

/**
 *
 * @param param0 - the account, parentAccount and transaction
 * @returns estimated fees
 */
const getEstimatedFees = async ({
  a,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  t,
}: {
  a: Account;
  t: Transaction;
}): Promise<BigNumber> => {
  const { estHnt } = await getTransactionFee(a, t);
  return estHnt;
};

export default getEstimatedFees;
