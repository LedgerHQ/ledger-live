import { BigNumber } from "bignumber.js";
import { CosmosOperationMode } from "../cosmos/types";

const gasForTransaction: {
  [Key in CosmosOperationMode]: number;
} = {
  send: 100000,
  delegate: 250000,
  undelegate: 275000,
  redelegate: 500000,
  claimReward: 300000, // Per https://github.com/chainapsis/keplr-wallet/blob/8d45477df2b2393a90786a5c87f814302b878c3d/packages/extension/src/stores/root.tsx#L240
  claimRewardCompound: 400000, // TODO - verify this value
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
  // Fees are currently zero in Osmosis
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
