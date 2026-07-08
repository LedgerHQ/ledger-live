import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { FiatCurrency } from "@domain/entity-currency-fiat";
import type { supportedCountervaluesData } from "~/reducers/types";

export function buildSupportedCounterValues(fiats: FiatCurrency[]): supportedCountervaluesData[] {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  return [...fiats, bitcoin, ethereum]
    .map(currency => ({
      value: currency.ticker,
      ticker: currency.ticker,
      label: `${currency.name} - ${currency.ticker}`,
      currency,
    }))
    .sort((a, b) => a.currency.name.localeCompare(b.currency.name));
}
