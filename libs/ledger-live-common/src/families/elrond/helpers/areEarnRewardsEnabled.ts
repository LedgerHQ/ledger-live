import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";

import { MIN_DELEGATION_AMOUNT } from "../constants";

export const areEarnRewardsEnabled = (account: Account) =>
  BigNumber(account.spendableBalance).isGreaterThanOrEqualTo(MIN_DELEGATION_AMOUNT);
