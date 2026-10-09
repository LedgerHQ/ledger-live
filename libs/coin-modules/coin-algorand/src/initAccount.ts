import type { AlgorandAccount } from "./types";

export function initAccount(account: AlgorandAccount): void {
  account.algorandResources = {
    nbAssets: account.subAccounts?.length ?? 0,
  };
}
