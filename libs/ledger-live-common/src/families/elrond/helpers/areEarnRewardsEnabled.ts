import { BigNumber } from "bignumber.js";
import { denominate } from "./denominate";
import { Account } from "@ledgerhq/types-live";

export const areEarnRewardsEnabled = (account: Account): boolean => {
  return BigNumber(
    denominate({
      input: String(account.spendableBalance),
      showLastNonZeroDecimal: true,
    })
  ).gte(1);
};
