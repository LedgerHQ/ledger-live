import type { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../constants";
import type { AptosAccount, Transaction } from "../types";
import { getMaxSendBalance } from "./logic";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
}: {
  account: AccountLike<AptosAccount>;
  parentAccount?: AptosAccount;
  transaction?: Transaction;
}): Promise<BigNumber> => {
  // Compute max spendable using the default gas budget (avoids too-tight simulation estimates).
  return getMaxSendBalance(
    account,
    parentAccount,
    new BigNumber(DEFAULT_GAS),
    new BigNumber(DEFAULT_GAS_PRICE),
  );
};

export default estimateMaxSpendable;
