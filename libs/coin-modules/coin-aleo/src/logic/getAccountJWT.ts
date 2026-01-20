import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiClient } from "../network/api";
import { AleoJWT } from "../types/api";

export async function getAccountJWT(
  currency: CryptoCurrency,
  apiKey: string,
  consumerId: string,
): Promise<AleoJWT> {
  const res = await apiClient.getAccountJWT(currency, apiKey, consumerId);
  const data = {
    token: res.headers?.["authorization"] ?? "",
    exp: res.data.exp,
  };

  return data;
}
