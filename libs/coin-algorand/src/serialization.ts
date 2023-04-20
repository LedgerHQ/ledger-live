import { BigNumber } from "bignumber.js";
import type {
  AlgorandResourcesRaw,
  AlgorandResources,
  AlgorandAccount,
  AlgorandAccountRaw,
} from "./types";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

function toResourcesRaw(r: AlgorandResources): AlgorandResourcesRaw {
  const { rewards, nbAssets } = r;
  return {
    rewards: rewards.toString(),
    nbAssets,
  };
}
function fromResourcesRaw(r: AlgorandResourcesRaw): AlgorandResources {
  const { rewards, nbAssets } = r;
  return {
    rewards: new BigNumber(rewards),
    nbAssets,
  };
}

export function assignToAccountRaw(
  account: Account,
  accountRaw: AccountRaw
): void {
  const algorandAccount = account as AlgorandAccount;
  const algorandAccountRaw = accountRaw as AlgorandAccountRaw;
  if (algorandAccount.algorandResources) {
    algorandAccountRaw.algorandResources = toResourcesRaw(
      algorandAccount.algorandResources
    );
  }
}

export function assignFromAccountRaw(
  accountRaw: AccountRaw,
  account: Account
): void {
  const algorandResourcesRaw = (accountRaw as AlgorandAccountRaw)
    .algorandResources;
  const algorandAccount = account as AlgorandAccount;
  if (algorandResourcesRaw) {
    algorandAccount.algorandResources = fromResourcesRaw(algorandResourcesRaw);
  }
}
