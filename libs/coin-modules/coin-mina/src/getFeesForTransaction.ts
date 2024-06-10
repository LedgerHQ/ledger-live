import { BigNumber } from "bignumber.js";
import { getFees } from "./api";
import { Transaction } from "./types";

const getEstimatedFees = async (transaction: Transaction, address: string): Promise<BigNumber> => {
  const fees = await getFees(transaction, address);

  return fees;
};

export default getEstimatedFees;
