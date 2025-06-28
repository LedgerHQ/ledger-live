import type { AccountRaw, Account } from "@ledgerhq/types-live";
import type {
  HederaAccount,
  HederaAccountRaw,
  HederaResources,
  HederaResourcesRaw,
} from "../types";
import BigNumber from "bignumber.js";

export function toHederaResourcesRaw(resources: HederaResources): HederaResourcesRaw {
  return {
    stakingNodeId: resources.stakingNodeId,
    stakingPendingReward: resources.stakingPendingReward.toString(),
  };
}

export function fromHederaResourcesRaw(rawResources: HederaResourcesRaw): HederaResources {
  return {
    stakingNodeId: rawResources.stakingNodeId,
    stakingPendingReward: new BigNumber(rawResources.stakingPendingReward),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const hederaAccount = account as HederaAccount;
  const hederaAccountRaw = accountRaw as HederaAccountRaw;

  if (hederaAccount.hederaResources) {
    hederaAccountRaw.hederaResources = toHederaResourcesRaw(hederaAccount.hederaResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const hederaAccount = account as HederaAccount;
  const hederaAccountRaw = accountRaw as HederaAccountRaw;

  if (hederaAccountRaw.hederaResources) {
    hederaAccount.hederaResources = fromHederaResourcesRaw(hederaAccountRaw.hederaResources);
  }
}
