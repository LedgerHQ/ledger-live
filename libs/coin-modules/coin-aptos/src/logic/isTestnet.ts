import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";

export function isTestnet(currencyId: string): boolean {
  return !!getCryptoCurrencyById(currencyId).isTestnetFor;
}
