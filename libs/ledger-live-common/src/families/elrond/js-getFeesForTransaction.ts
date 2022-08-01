import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";
import { getFees } from "./api";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Transaction} t
 */
const getEstimatedFees = async (t: Transaction): Promise<BigNumber> => {
  return await getFees(t);
};

export default getEstimatedFees;
