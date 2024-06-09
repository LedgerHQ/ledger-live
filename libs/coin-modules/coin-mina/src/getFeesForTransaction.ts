import { BigNumber } from "bignumber.js";
import { getFees } from "./api";
import { Transaction } from "./types";

const getEstimatedFees = async (_transaction: Transaction): Promise<BigNumber> => {
  const gasPrice = await getFees();

  return gasPrice;
};

export default getEstimatedFees;
