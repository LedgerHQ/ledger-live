import BN from "bn.js";
import * as nearAPI from "near-api-js";
import type { Action } from "near-api-js/lib/transaction";
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
const nearAmount = (amount: string) => new BN(amount);
const stakingGas = () => nearAmount(getStakingGas().toFixed());

export const buildActions = ({ mode, amount, useAllAmount }: ActionsInput): Action[] => {
  switch (mode) {
    case "stake":
      return [
        nearAPI.transactions.functionCall(
          "deposit_and_stake",
          {},
          stakingGas(),
          nearAmount(amount),
        ),
      ];
    case "unstake":
      return useAllAmount
        ? [nearAPI.transactions.functionCall("unstake_all", {}, stakingGas(), nearAmount("0"))]
        : [nearAPI.transactions.functionCall("unstake", { amount }, stakingGas(), nearAmount("0"))];
    case "withdraw":
      return useAllAmount
        ? [nearAPI.transactions.functionCall("withdraw_all", {}, stakingGas(), nearAmount("0"))]
        : [
            nearAPI.transactions.functionCall(
              "withdraw",
              { amount },
              stakingGas(),
              nearAmount("0"),
            ),
          ];
    default:
      return [nearAPI.transactions.transfer(nearAmount(amount))];
  }
};
