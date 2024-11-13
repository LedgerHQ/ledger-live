import { getEnv } from "@ledgerhq/live-env";
import { ExchangeProviderNameAndSignature } from ".";
import { getProvidersData } from "../../cal";

const testSellProvider: ExchangeProviderNameAndSignature = {
  name: "SELL_TEST",
  publicKey: {
    curve: "secp256k1",
    data: Buffer.from(
      "0478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3",
      "hex",
    ),
  },
  signature: Buffer.from(
    "30440220471b035b40dafa095d615998c82202b2bd00fb45670b828f1dda3b68e5b24cc3022022a1c64d02b8c14e1e4cc2d05b00234642c11db3d4461ff5366f5af337cf0ced",
    "hex",
  ),
  version: 2,
};

let providerDataCache: Record<string, ExchangeProviderNameAndSignature> | null = null;

/**
 * The result is cached after the first successful fetch to avoid redundant network calls.
 * - "fund" providers currently include Mercuryo, which is stored as a fund provider.
 *   If this behavior changes, this logic should be revisited.
 *   Reference: https://github.dev/LedgerHQ/crypto-assets/blob/main/assets/partners/mercuryo/common.json
 */
export const fetchAndMergeProviderData = async () => {
  if (providerDataCache) {
    return providerDataCache;
  }
  try {
    const [sellProvidersData, fundProviderData] = await Promise.all([
      getProvidersData("sell"),
      getProvidersData("fund"), // Mercuryo is currently treated as a fund provider
    ]);
    providerDataCache = { ...sellProvidersData, ...fundProviderData };
    return providerDataCache;
  } catch (error) {
    console.error("Error fetching or processing provider data:", error);
  }
};

export const getSellProvider = async (
  providerName: string,
): Promise<ExchangeProviderNameAndSignature> => {
  if (getEnv("MOCK_EXCHANGE_TEST_CONFIG")) {
    return testSellProvider;
  }
  const res = await fetchAndMergeProviderData();

  if (!res) {
    throw new Error("Failed to fetch provider data");
  }
  const provider = res[providerName.toLowerCase()];
  if (!provider) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return provider;
};
