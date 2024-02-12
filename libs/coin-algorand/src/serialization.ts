import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  isAlgorandOperationExtra,
  isAlgorandOperationExtraRaw,
  type AlgorandAccount,
  type AlgorandAccountRaw,
  type AlgorandOperationExtra,
  type AlgorandOperationExtraRaw,
  type AlgorandResources,
  type AlgorandResourcesRaw,
} from "./types";

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

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const algorandAccount = account as AlgorandAccount;
  const algorandAccountRaw = accountRaw as AlgorandAccountRaw;
  if (algorandAccount.algorandResources) {
    algorandAccountRaw.algorandResources = toResourcesRaw(algorandAccount.algorandResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const algorandResourcesRaw = (accountRaw as AlgorandAccountRaw).algorandResources;
  const algorandAccount = account as AlgorandAccount;
  if (algorandResourcesRaw) {
    algorandAccount.algorandResources = fromResourcesRaw(algorandResourcesRaw);
  }
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  const extra: AlgorandOperationExtra = {};
  if (!isAlgorandOperationExtraRaw(extraRaw)) {
    return extra;
  }

  if (extraRaw.rewards) {
    extra.rewards = new BigNumber(extraRaw.rewards);
  }

  if (extraRaw.memo) {
    extra.memo = extraRaw.memo;
  }

  if (extraRaw.assetId) {
    extra.assetId = extraRaw.assetId;
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  const extraRaw: AlgorandOperationExtraRaw = {};
  if (!isAlgorandOperationExtra(extra)) {
    return extraRaw;
  }

  if (extra.rewards) {
    extraRaw.rewards = extra.rewards.toString();
  }

  if (extra.memo) {
    extraRaw.memo = extra.memo;
  }

  if (extra.assetId) {
    extraRaw.assetId = extra.assetId;
  }

  return extraRaw;
}
