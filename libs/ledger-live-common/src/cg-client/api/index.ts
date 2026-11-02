import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";

const baseURL = getEnv("COINGECKO_API_URL");

export async function supportedCounterCurrencies(): Promise<string[]> {
  const url = `${baseURL}/simple/supported_vs_currencies`;

  const { data } = await network<string[]>({
    method: "GET",
    url,
  });

  return data;
}
