import { getTransactions } from "../network";
import { ApiResponseTransaction } from "../types";

export const getAllTransactions = async (
  addr: string,
  afterValue: number,
): Promise<ApiResponseTransaction[]> => {
  if (afterValue === 0) {
    afterValue = 1;
  }

  let allTransactions: ApiResponseTransaction[] = [];

  let nextPageAfter: string | null = afterValue.toString();
  while (nextPageAfter) {
    const response = await getTransactions(addr, parseInt(nextPageAfter));
    allTransactions = allTransactions.concat(response.transactions);
    nextPageAfter = response.nextPageAfter;
  }

  return allTransactions;
};
