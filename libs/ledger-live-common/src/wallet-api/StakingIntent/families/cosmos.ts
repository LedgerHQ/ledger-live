import {
  canDelegate,
  canRedelegate,
  canUndelegate,
} from "../../../families/cosmos/logic";
import type { CosmosAccount } from "../../../families/cosmos/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

const COSMOS_MAX_REDELEGATIONS = 7;

function asCosmos(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): CosmosAccount {
  return account as CosmosAccount;
}

const cosmosIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Delegate",
    isEnabled: account => canDelegate(asCosmos(account)),
  },
  {
    intent: "unstake",
    label: "Undelegate",
    params: ["validatorAddress"],
    isEnabled: account => {
      const cosmosAccount = asCosmos(account);
      const { cosmosResources } = cosmosAccount;
      if (!cosmosResources) return false;
      return (
        canUndelegate(cosmosAccount) && (cosmosResources.delegations?.length ?? 0) > 0
      );
    },
  },
  {
    intent: "restake",
    label: "Redelegate",
    params: ["validatorAddress"],
    isEnabled: account => {
      const cosmosAccount = asCosmos(account);
      const { cosmosResources } = cosmosAccount;
      if (!cosmosResources?.delegations?.length) return false;
      if ((cosmosResources.redelegations?.length ?? 0) >= COSMOS_MAX_REDELEGATIONS) {
        return false;
      }
      return cosmosResources.delegations.some(d => canRedelegate(cosmosAccount, d));
    },
  },
  {
    intent: "claimRewards",
    label: "Claim rewards",
    params: ["validatorAddress"],
    isEnabled: account => {
      const { cosmosResources } = asCosmos(account);
      if (!cosmosResources) return false;
      const hasDelegations = (cosmosResources.delegations?.length ?? 0) > 0;
      return hasDelegations && cosmosResources.pendingRewardsBalance.gt(0);
    },
  },
];

registerFamily("cosmos", cosmosIntents);
