import { BigNumber } from "bignumber.js";
import { CosmosOperationMode } from "../cosmos/types";

const gasForTransaction: {
  [Key in CosmosOperationMode]: number;
} = {
  send: 100000,
  delegate: 300000,
  undelegate: 350000,
  redelegate: 550000,
  claimReward: 300000,
  claimRewardCompound: 400000,
};

// Default fees in uosmo
// Dear future developer working on this file, if fees become non-zero
// make sure to flip estimatedFees.isZero() to !estimatedFees.isZero() in
// './deviceTransactionConfig.ts'.
export const DEFAULT_FEES = 0;
export const MIN_GAS_FEE = 0.0025; // Min gas fee in uosmo (https://commonwealth.im/osmosis/discussion/6298-draft-minimum-gas-fee)
export const DEFAULT_GAS = 100000;

/**
 * Fetch the transaction fees for a transaction
 */
const getEstimatedFees = async (mode: string): Promise<BigNumber> => {
  const gas = await getEstimatedGas(mode as CosmosOperationMode);
  return gas.times(MIN_GAS_FEE);
};

/**
 * Fetch the gas for a transaction
 */
export const getEstimatedGas = async (
  mode: CosmosOperationMode
): Promise<BigNumber> => {
  const estimatedGas = gasForTransaction[mode];
  if (!estimatedGas) {
    return new BigNumber(DEFAULT_GAS);
  }
  return new BigNumber(estimatedGas);
};

export default getEstimatedFees;
