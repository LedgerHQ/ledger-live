import { BigNumber } from "bignumber.js";
import { getFees } from "./api";
import { Transaction } from "./types";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Transaction} t
 */
const getEstimatedFees = async (t: Transaction): Promise<BigNumber> => {
  return await getFees(t);
};

export default getEstimatedFees;
