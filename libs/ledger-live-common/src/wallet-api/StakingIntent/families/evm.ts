import {
  canDelegate,
  canRedelegate,
  canUndelegate,
} from "../../../families/evm/staking/logic";
import type { StakingAccount } from "../../../families/evm/staking/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asStakingAccount(
  account: Parameters<FamilyIntentConfig["isEnabled"]>[0],
): StakingAccount {
  return account as StakingAccount;
}

const evmIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Stake",
    isEnabled: account => canDelegate(asStakingAccount(account)),
  },
  {
    intent: "unstake",
    label: "Undelegate",
    params: ["validatorAddress"],
    isEnabled: account => {
      const stakingAccount = asStakingAccount(account);
      const delegations = stakingAccount.stakingResources?.delegations ?? [];
      return canUndelegate(stakingAccount) && delegations.length > 0;
    },
  },
  {
    intent: "restake",
    label: "Redelegate",
    params: ["validatorAddress", "validatorDstAddress"],
    isEnabled: account => {
      const stakingAccount = asStakingAccount(account);
      const delegations = stakingAccount.stakingResources?.delegations ?? [];
      return delegations.some(d => canRedelegate(stakingAccount, d));
    },
  },
];

registerFamily("evm", evmIntents);
