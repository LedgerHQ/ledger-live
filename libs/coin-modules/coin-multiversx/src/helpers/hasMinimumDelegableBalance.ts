import { Account } from "@ledgerhq/types-live";

import { MIN_DELEGATION_AMOUNT } from "../constants";

export const hasMinimumDelegableBalance = (account: Account) =>
  account.spendableBalance.isGreaterThanOrEqualTo(MIN_DELEGATION_AMOUNT);
