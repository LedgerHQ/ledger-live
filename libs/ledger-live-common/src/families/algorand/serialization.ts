import { BigNumber } from "bignumber.js";
import type { AlgorandResourcesRaw, AlgorandResources, AlgorandAccount, AlgorandAccountRaw } from "./types";
import type {
  Account,
  AccountRaw,
} from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";

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

export function applyReconciliation(account: Account, updatedRaw: AccountRaw, next: Account): boolean {
  let changed = false;
  const algorandAcc = account as AlgorandAccount;
  const algorandUpdatedRaw = updatedRaw as AlgorandAccountRaw;
  if (
    !isEqual(
      algorandAcc.algorandResources,
      algorandUpdatedRaw.algorandResources
    )
  ) {
    (next as AlgorandAccount).algorandResources = fromResourcesRaw(
      algorandUpdatedRaw.algorandResources
    );
    changed = true;
  }
  return changed;
}

export function toAccountRaw(account: Account, accountRaw: AccountRaw): void {
  (accountRaw as AlgorandAccountRaw).algorandResources = toResourcesRaw(
    (account as AlgorandAccount).algorandResources
  );
}

export function fromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const algoResourcesRaw = (accountRaw as AlgorandAccountRaw)
  .algorandResources;
if (algoResourcesRaw)
  (account as AlgorandAccount).algorandResources =
    fromResourcesRaw(algoResourcesRaw);
}
