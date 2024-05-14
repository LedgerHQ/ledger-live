import { BigNumber } from "bignumber.js";
import { getFees } from "../api";
import { Transaction } from "../types/common";

const getEstimatedFees = async (
  transaction: Transaction,
  address: string,
): Promise<{
  fee: BigNumber;
  accountCreationFee: BigNumber;
}> => {
  const { fee, accountCreationFee } = await getFees(transaction, address);

  return { fee, accountCreationFee };
};

export default getEstimatedFees;
