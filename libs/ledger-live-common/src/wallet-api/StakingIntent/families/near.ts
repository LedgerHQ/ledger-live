import { canUnstake, canWithdraw } from "../../../families/near/logic";
import type { NearAccount } from "../../../families/near/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asNear(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): NearAccount {
  return account as NearAccount;
}

const nearIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Stake",
    isEnabled: account => !asNear(account).balance.isZero(),
  },
  {
    intent: "unstake",
    label: "Unstake",
    params: ["validatorAddress"],
    isEnabled: account => {
      const positions = asNear(account).nearResources?.stakingPositions ?? [];
      return positions.some(p => canUnstake(p));
    },
  },
  {
    intent: "withdraw",
    label: "Withdraw",
    params: ["validatorAddress"],
    isEnabled: account => {
      const positions = asNear(account).nearResources?.stakingPositions ?? [];
      return positions.some(p => canWithdraw(p));
    },
  },
];

registerFamily("near", nearIntents);
