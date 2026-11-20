import type { ExchangeTypes, PartnerKeyInfo } from "@ledgerhq/hw-app-exchange";
import { EXCHANGE_TYPE } from "../intents/exchangeTypes";
import { getSwapProvider, getAvailableProviders } from "./swap";
import { getSellProvider } from "./sell";
import { getFundProvider } from "./fund";
import { getEnv } from "@shared/env";

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
  provider: string,
): Promise<ExchangeProviderNameAndSignature> => {
  if (getEnv("MOCK_EXCHANGE_TEST_CONFIG") && testProvider) {
    return testProvider;
  }
  const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";

  switch (exchangeType) {
    case EXCHANGE_TYPE.fund:
    case EXCHANGE_TYPE.fundNg:
      return getFundProvider({
        providerId: provider.toLowerCase(),
        ledgerSignatureEnv,
        partnerSignatureEnv,
      });

    case EXCHANGE_TYPE.sell:
    case EXCHANGE_TYPE.sellNg:
      return await getSellProvider({
        providerId: provider.toLowerCase(),
        ledgerSignatureEnv,
        partnerSignatureEnv,
      });

    default:
      throw new Error(`Unknown partner ${provider} type`);
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
export function removeTestProviderInfo(): ExchangeProviderNameAndSignature | undefined {
  return (testProvider = undefined);
}
