import { BigNumber } from "bignumber.js";
import type { NearActionCosts } from "../network/protocolConfig";
import { getStakingFees, isImplicitAccount } from "../logic";

/** Gas costs the fee formula needs; a subset of {@link NearActionCosts}. */
export type NearFeeCosts = Omit<NearActionCosts, "storageCost">;

export type FeeInput = {
  mode: string;
  recipient: string;
  useAllAmount?: boolean;
  gasPrice: BigNumber;
  costs: NearFeeCosts;
};

const STAKING_MODES = new Set(["stake", "unstake", "withdraw"]);

// Fee for a transaction, in yoctoNEAR — single formula shared by the account bridge (`costs` from
// preload) and CoinModuleApi (from the protocol config). Sending to a not-yet-existing implicit
// account also pays for creating it and adding its access key.
export const computeFees = ({
  mode,
  recipient,
  useAllAmount,
  gasPrice,
  costs,
}: FeeInput): BigNumber => {
  if (STAKING_MODES.has(mode)) {
    return getStakingFees({ mode, useAllAmount: useAllAmount ?? false }, gasPrice);
  }

  let sendFee = costs.transferCostSend.plus(costs.receiptCreationSend);
  let executionFee = costs.transferCostExecution.plus(costs.receiptCreationExecution);

  if (isImplicitAccount(recipient)) {
    sendFee = sendFee.plus(costs.createAccountCostSend).plus(costs.addKeyCostSend);
    executionFee = executionFee
      .plus(costs.createAccountCostExecution)
      .plus(costs.addKeyCostExecution);
  }

  return sendFee.multipliedBy(gasPrice).plus(executionFee.multipliedBy(gasPrice));
};
