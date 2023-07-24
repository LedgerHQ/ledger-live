import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getExplorerApi } from "../explorer";

export const getTransactionByHash = async (
  currency: CryptoCurrency,
  transactionHash: string,
): Promise<{ confirmations?: number }> => {
  const { getTransactionByHash: apiGetTransactionByHash } = getExplorerApi(currency);
  if (!apiGetTransactionByHash) {
    return {};
  }

  return apiGetTransactionByHash(currency, transactionHash);
};
