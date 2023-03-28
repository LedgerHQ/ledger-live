import { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type {
  AvalanchePChainResourcesRaw,
  AvalanchePChainResources,
  AvalanchePChainAccount,
  AvalanchePChainAccountRaw,
} from "./types";

function toResourcesRaw(
  r: AvalanchePChainResources
): AvalanchePChainResourcesRaw {
  const { publicKey, chainCode, stakedBalance, delegations } = r;

  return {
    publicKey,
    chainCode,
    stakedBalance: stakedBalance.toString(),
    delegations: delegations?.map((delegation) => ({
      txID: delegation.txID,
      startTime: delegation.startTime,
      endTime: delegation.endTime,
      stakeAmount: delegation.stakeAmount.toString(),
      nodeID: delegation.nodeID,
    })),
  };
}

function fromResourcesRaw(
  r: AvalanchePChainResourcesRaw
): AvalanchePChainResources {
  const { publicKey, chainCode, stakedBalance, delegations } = r;

  return {
    publicKey,
    chainCode,
    stakedBalance: new BigNumber(stakedBalance),
    delegations: delegations?.map((delegation) => ({
      txID: delegation.txID,
      startTime: delegation.startTime,
      endTime: delegation.endTime,
      stakeAmount: new BigNumber(delegation.stakeAmount),
      nodeID: delegation.nodeID,
    })),
  };
}


export function assignToAccountRaw(
  account: Account,
  accountRaw: AccountRaw
): void {
  const avalanchePChainAccount = account as AvalanchePChainAccount;
  const avalanchePChainAccountRaw = accountRaw as AvalanchePChainAccountRaw;
  if (avalanchePChainAccount.avalanchePChainResources) {
    avalanchePChainAccountRaw.avalanchePChainResources = toResourcesRaw(
      avalanchePChainAccount.avalanchePChainResources
    );
  }
}

export function assignFromAccountRaw(
  accountRaw: AccountRaw,
  account: Account
): void {
  const avalanchePChainResourcesRaw = (accountRaw as AvalanchePChainAccountRaw)
    .avalanchePChainResources;
  const avalanchePChainAccount = account as AvalanchePChainAccount;
  if (avalanchePChainResourcesRaw) {
    avalanchePChainAccount.avalanchePChainResources = fromResourcesRaw(avalanchePChainResourcesRaw);
  }
}
