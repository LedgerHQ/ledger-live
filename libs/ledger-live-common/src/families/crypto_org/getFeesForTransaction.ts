import { BigNumber } from "bignumber.js";
import { FIXED_GAS_PRICE, FIXED_DEFAULT_GAS_LIMIT } from "./logic";

/**
 * Fetch the transaction fees for a transaction
 */
const getEstimatedFees = async (): Promise<BigNumber> => {
  // TODO: call gas station to get a more accurate tx fee in the future
  const estimateFee = Math.ceil(FIXED_GAS_PRICE * FIXED_DEFAULT_GAS_LIMIT);
  return new BigNumber(estimateFee);
};

export default getEstimatedFees;
