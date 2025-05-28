import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export function isTestnet(currencyId: string): boolean {
  return !!getCryptoCurrencyById(currencyId).isTestnetFor;
}
