import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, Transaction } from "../types/bridge";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  KaspaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  return new BigNumber(42);
};
