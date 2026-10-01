import { actions, type Action } from "near-api-js";
import { getStakingGas } from "../logic";

export type ActionsInput = {
  mode: string;
  /** Amount in yoctoNEAR. */
  amount: string;
  useAllAmount?: boolean;
};

// One action per supported mode. Staking goes through the pool contract (attached deposit when
// staking, call argument otherwise); `_all` variants take no amount, so "use all" can't leave dust
// behind if the balance moves between crafting and execution.
export const buildActions = ({ mode, amount, useAllAmount }: ActionsInput): Action[] => {
  const gas = BigInt(getStakingGas().toFixed());

  switch (mode) {
    case "stake":
      return [actions.functionCall("deposit_and_stake", {}, gas, BigInt(amount))];
    case "unstake":
      return useAllAmount
        ? [actions.functionCall("unstake_all", {}, gas, 0n)]
        : [actions.functionCall("unstake", { amount }, gas, 0n)];
    case "withdraw":
      return useAllAmount
        ? [actions.functionCall("withdraw_all", {}, gas, 0n)]
        : [actions.functionCall("withdraw", { amount }, gas, 0n)];
    default:
      return [actions.transfer(BigInt(amount))];
  }
};
