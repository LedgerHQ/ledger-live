import { fetchAccountTransactions, RosettaTransaction } from "../../api";

export const getTransactions = async (
  address: string,
  offset: number = 0,
): Promise<RosettaTransaction[]> => {
  const txns = await fetchAccountTransactions(address, offset);
  return txns.sort((a, b) => b.timestamp - a.timestamp);
};
