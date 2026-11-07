import { FAMILIES, type Currency as WalletAPICurrency } from "@ledgerhq/wallet-api-core";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export const FAMILIES_MAPPING_WAPI_TO_LL = {
  ethereum: "evm",
  ripple: "xrp",
  elrond: "multiversx",
} as const;

export const FAMILIES_MAPPING_LL_TO_WAPI: Record<string, string> = Object.fromEntries(
  Object.entries(FAMILIES_MAPPING_WAPI_TO_LL).map(([wapi, ll]) => [ll, wapi]),
);

/** The live families the Wallet API names, its own and the ones it names differently. */
export const WALLET_API_FAMILIES: readonly string[] = [
  ...FAMILIES,
  ...Object.values(FAMILIES_MAPPING_WAPI_TO_LL),
];

export type WalletAPISupportedCurrency = CryptoCurrency | TokenCurrency;

export const isWalletAPISupportedFamily = (family: string): boolean =>
  WALLET_API_FAMILIES.includes(family);

export function currencyToWalletAPICurrency(
  currency: WalletAPISupportedCurrency,
): WalletAPICurrency {
  if (currency.type === "TokenCurrency") {
    return {
      type: "TokenCurrency",
      standard: "ERC20",
      id: currency.id,
      ticker: currency.ticker,
      contract: currency.contractAddress,
      name: currency.name,
      parent: currency.parentCurrencyId,
      color: getCryptoCurrencyById(currency.parentCurrencyId).color,
      decimals: currency.units[0].magnitude,
    };
  }
  return {
    type: "CryptoCurrency",
    id: currency.id,
    ticker: currency.ticker,
    name: currency.name,
    family: FAMILIES_MAPPING_LL_TO_WAPI[currency.family] ?? currency.family,
    color: currency.color,
    decimals: currency.units[0].magnitude,
  };
}
