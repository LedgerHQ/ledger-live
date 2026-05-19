import {
  canRestake,
  canStake,
  canUnstake,
  canWithdraw,
} from "@ledgerhq/coin-aptos/logic/staking";
import type { AptosAccount } from "../../../families/aptos/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asAptos(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): AptosAccount {
  return account as AptosAccount;
}

const aptosIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Stake",
    isEnabled: account => canStake(asAptos(account)),
  },
  {
    intent: "unstake",
    label: "Unstake",
    params: ["validatorAddress"],
    isEnabled: account => {
      const positions = asAptos(account).aptosResources?.stakingPositions ?? [];
      return positions.some(p => canUnstake(p));
    },
  },
  {
    intent: "restake",
    label: "Restake",
    params: ["validatorAddress"],
    isEnabled: account => {
      const positions = asAptos(account).aptosResources?.stakingPositions ?? [];
      return positions.some(p => canRestake(p));
    },
  },
  {
    intent: "withdraw",
    label: "Withdraw",
    params: ["validatorAddress"],
    isEnabled: account => {
      const positions = asAptos(account).aptosResources?.stakingPositions ?? [];
      return positions.some(p => canWithdraw(p));
    },
  },
];

registerFamily("aptos", aptosIntents);
