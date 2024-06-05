import { BigNumber } from "bignumber.js";
import type { AlgorandAccount } from "./types";

export function initAccount(account: AlgorandAccount): void {
  account.algorandResources = {
    rewards: new BigNumber(0),
    nbAssets: account.subAccounts?.length ?? 0,
  };
}
