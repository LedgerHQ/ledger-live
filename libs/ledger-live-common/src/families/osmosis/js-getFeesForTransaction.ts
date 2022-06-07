import { BigNumber } from "bignumber.js";
import { CosmosOperationMode } from "../cosmos/types";

const gasForTransaction: {
  [Key in CosmosOperationMode]: number;
} = {
  send: 100000,
  delegate: 250000,
  undelegate: 350000,
  redelegate: 350000,
  claimReward: 250000, // TODO, this should be 140000 but need to figure out correct gas calculation
  claimRewardCompound: 350000, // TODO - verify this value
};

// Default fees in uosmo
// Dear future developer working on this file, if fees become non-zero
// make sure to flip estimatedFees.isZero() to !estimatedFees.isZero() in
// './deviceTransactionConfig.ts'.
export const DEFAULT_FEES = 0;

/**
 * Fetch the transaction fees for a transaction
 */
const getEstimatedFees = async (): Promise<BigNumber> => {
  // for "send" transactions fees are zero
  return new BigNumber(DEFAULT_FEES);
};

/**
 * Fetch the gas for a transaction
 */
export const getEstimatedGas = async (
  mode: CosmosOperationMode
): Promise<BigNumber> => {
  const estimatedGas = gasForTransaction[mode];
  if (!estimatedGas) {
    throw new Error(
      `Estimated gas for the operation mode ${mode} is undefined`
    );
  }

  if (mode === "claimReward") {
    // TODO do proper gas calculation
    // estimatedGas = estimatedGas * validators.length
  }

  return new BigNumber(estimatedGas);
};

export default getEstimatedFees;
