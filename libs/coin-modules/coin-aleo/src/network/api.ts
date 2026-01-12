import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import aleoConfig from "../config";

const getNodeUrl = (currency: CryptoCurrency): string => {
  return aleoConfig.getCoinConfig(currency).nodeUrl;
};

async function getAccountBalance(
  currency: CryptoCurrency,
  address: string,
): Promise<string | null> {
  const res = await network<string | null>({
    method: "GET",
    url: `${getNodeUrl(currency)}/programs/program/credits.aleo/mapping/account/${address}`,
  });

  return res.data;
}

export const apiClient = {
  getAccountBalance,
};
