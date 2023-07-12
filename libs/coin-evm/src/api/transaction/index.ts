import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const getTransactionByHash = async (
  currency: CryptoCurrency,
  transactionHash: string,
): Promise<{ confirmations?: number }> => {
  const explorerId = currency.explorerId ?? currency.id;

  const { data } = await network({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${explorerId}/tx/${transactionHash}`,
  });

  return data;
};
