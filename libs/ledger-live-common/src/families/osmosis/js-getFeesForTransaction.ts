import { BigNumber } from "bignumber.js";

// Default gas for Osmosis
export const DEFAULT_GAS = 100000;

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
export const getEstimatedGas = async (): Promise<BigNumber> => {
  return new BigNumber(DEFAULT_GAS);
};

export default getEstimatedFees;
