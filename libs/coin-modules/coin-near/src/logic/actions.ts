import * as nearAPI from "near-api-js";
import type { Action } from "near-api-js/lib/transaction";
import { getStakingGas } from "../logic";

export type ActionsInput = {
  mode: string;
  /** Amount in yoctoNEAR. */
  amount: string;
  useAllAmount?: boolean;
};

/**
 * The actions of a NEAR transaction, one per supported mode.
 *
 * Staking goes through the staking pool contract: the amount is the attached deposit when staking,
 * and a call argument when unstaking or withdrawing. The `_all` variants take no amount, which is
 * how "use all" avoids leaving dust behind when the balance moves between crafting and execution.
 */
export const buildActions = ({ mode, amount, useAllAmount }: ActionsInput): Action[] => {
  switch (mode) {
    case "stake":
      return [
        nearAPI.transactions.functionCall(
          "deposit_and_stake",
          {},
          getStakingGas().toFixed(),
          amount,
        ),
      ];
    case "unstake":
      return useAllAmount
        ? [nearAPI.transactions.functionCall("unstake_all", {}, getStakingGas().toFixed(), "0")]
        : [
            nearAPI.transactions.functionCall(
              "unstake",
              { amount },
              getStakingGas().toFixed(),
              "0",
            ),
          ];
    case "withdraw":
      return useAllAmount
        ? [
            nearAPI.transactions.functionCall(
              "withdraw_all",
              {},
              getStakingGas({ mode, useAllAmount }).toNumber(),
              "0",
            ),
          ]
        : [
            nearAPI.transactions.functionCall(
              "withdraw",
              { amount },
              getStakingGas().toFixed(),
              "0",
            ),
          ];
    default:
      return [nearAPI.transactions.transfer(amount)];
  }
};
