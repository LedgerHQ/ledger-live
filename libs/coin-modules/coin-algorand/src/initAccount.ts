import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { AlgorandAccount } from "./types";

export function initAccount(r: Account): void {
  (r as AlgorandAccount).algorandResources = {
    rewards: new BigNumber(0),
    nbAssets: r.subAccounts?.length ?? 0,
  };
}
