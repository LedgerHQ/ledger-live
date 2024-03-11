import { ExchangeTypes, PartnerKeyInfo } from "@ledgerhq/hw-app-exchange";
import { getSwapProvider, getAvailableProviders } from "./swap";
import { getSellProvider } from "./sell";
import { getFundProvider } from "./fund";

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

export const getProviderConfig = (
  exchangeType: ExchangeTypes,
  providerName: string,
): ExchangeProviderNameAndSignature => {
  switch (exchangeType) {
    case ExchangeTypes.Fund:
    case ExchangeTypes.FundNg:
      return getFundProvider(providerName.toLowerCase());

    case ExchangeTypes.Sell:
    case ExchangeTypes.SellNg:
      return getSellProvider(providerName.toLowerCase());

    default:
      throw new Error(`Unknown partner ${providerName} type`);
  }
};
