import { ExchangeTypes, PartnerKeyInfo } from "@ledgerhq/hw-app-exchange";
import { getSwapProvider, getAvailableProviders } from "./swap";
import { getSellProvider } from "./sell";
import { getFundProvider } from "./fund";
import { getEnv } from "@ledgerhq/live-env";

export { getSwapProvider, getAvailableProviders };

export type ExchangeProviderNameAndSignature = {
  name: string;
  publicKey: {
    curve: "secp256k1" | "secp256r1";
    data: Buffer;
  };
  version?: number;
  signature: Buffer;
};

export function convertToAppExchangePartnerKey(
  provider: ExchangeProviderNameAndSignature,
): PartnerKeyInfo {
  return {
    name: provider.name,
    curve: provider.publicKey.curve,
    publicKey: provider.publicKey.data,
  };
}

export const getProviderConfig = async (
  exchangeType: ExchangeTypes,
  providerName: string,
): Promise<ExchangeProviderNameAndSignature> => {
  if (getEnv("MOCK_EXCHANGE_TEST_CONFIG") && testProvider) {
    return testProvider;
  }

  switch (exchangeType) {
    case ExchangeTypes.Fund:
    case ExchangeTypes.FundNg:
      return getFundProvider(providerName.toLowerCase());

    case ExchangeTypes.Sell:
    case ExchangeTypes.SellNg:
      return await getSellProvider(providerName.toLowerCase());

    default:
      throw new Error(`Unknown partner ${providerName} type`);
  }
};

let testProvider: ExchangeProviderNameAndSignature | undefined;

type TestProvider = {
  name: string;
  publicKey: {
    curve: "secp256k1" | "secp256r1";
    data: string;
  };
  service: {
    appVersion: number;
    name: "swap" | "sell" | "fund";
  };
  signature: string;
};
export function setTestProviderInfo(provider: string) {
  const { name, publicKey, signature, service } = JSON.parse(provider) as TestProvider;
  testProvider = {
    name,
    publicKey: {
      curve: publicKey.curve,
      data: Buffer.from(publicKey.data, "hex"),
    },
    signature: Buffer.from(signature, "hex"),
    version: service.appVersion,
  };
}
export function getTestProviderInfo(): ExchangeProviderNameAndSignature | undefined {
  return testProvider;
}
