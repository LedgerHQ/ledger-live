import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, KaspaTransaction } from "../types/bridge";

export const estimateMaxSpendable: AccountBridge<
  KaspaTransaction,
  KaspaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  return new BigNumber(42);
};
