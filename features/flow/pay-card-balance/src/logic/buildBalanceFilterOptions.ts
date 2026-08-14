import type { Unit } from "@domain/entity-currency-unit";
import { PAY_CARD_BALANCE_FILTER_ALL } from "@domain/entity-pay-card";
import type { PayCardBalanceFilterOption } from "../types";

/** Always-offered stablecoin (USDC/USDT), taken from the top of the market-cap list. */
export type DefaultStablecoin = Readonly<{
  id: string;
  ticker: string;
  name: string;
  magnitude: number;
}>;

/** Minimal held-stablecoin shape consumed by {@link buildBalanceFilterOptions}. */
export type PayCardStablecoinItem = Readonly<{
  currency: Readonly<{
    id: string;
    name: string;
    ticker: string;
    units: readonly Unit[];
  }>;
  balance: number;
  value: number;
}>;

export type BuildBalanceFilterOptionsParams = Readonly<{
  stablecoins: readonly PayCardStablecoinItem[];
  defaultStablecoins: readonly DefaultStablecoin[];
  allLabel: string;
  /** Formats a fiat countervalue, e.g. `(1000) => "$1,000.00"`. */
  formatFiat: (value: number) => string;
  /** Formats a crypto amount for a unit, e.g. `(usdcUnit, 1_000_000_000) => "1,000.00 USDC"`. */
  formatCrypto: (unit: Unit, balance: number) => string;
}>;

function assetOption(
  id: string,
  item: PayCardStablecoinItem,
  formatFiat: (value: number) => string,
  formatCrypto: (unit: Unit, balance: number) => string,
  override?: Pick<DefaultStablecoin, "name" | "ticker">,
): PayCardBalanceFilterOption {
  return {
    id,
    title: override?.name ?? item.currency.name,
    ticker: override?.ticker ?? item.currency.ticker,
    ledgerId: id,
    countervalue: item.value,
    countervalueLabel: formatFiat(item.value),
    cryptoAmountLabel: formatCrypto(item.currency.units[0], item.balance),
  };
}

export function buildBalanceFilterOptions({
  stablecoins,
  defaultStablecoins,
  allLabel,
  formatFiat,
  formatCrypto,
}: BuildBalanceFilterOptionsParams): PayCardBalanceFilterOption[] {
  const byTicker = new Map<string, PayCardStablecoinItem>();
  for (const item of stablecoins) {
    byTicker.set(item.currency.ticker.toUpperCase(), item);
  }

  const unfilteredTotal = stablecoins.reduce((total, { value }) => total + value, 0);

  const options: PayCardBalanceFilterOption[] = [
    {
      id: PAY_CARD_BALANCE_FILTER_ALL,
      title: allLabel,
      countervalue: unfilteredTotal,
      countervalueLabel: formatFiat(unfilteredTotal),
    },
  ];

  const defaultTickers = new Set(defaultStablecoins.map(coin => coin.ticker.toUpperCase()));
  for (const coin of defaultStablecoins) {
    const held = byTicker.get(coin.ticker.toUpperCase());
    if (held) {
      options.push(assetOption(coin.id, held, formatFiat, formatCrypto, coin));
    } else {
      const unit: Unit = { name: coin.name, code: coin.ticker, magnitude: coin.magnitude };
      options.push({
        id: coin.id,
        title: coin.name,
        ticker: coin.ticker,
        ledgerId: coin.id,
        countervalue: 0,
        countervalueLabel: formatFiat(0),
        cryptoAmountLabel: formatCrypto(unit, 0),
      });
    }
  }

  const others = stablecoins
    .filter(item => !defaultTickers.has(item.currency.ticker.toUpperCase()))
    .sort((a, b) => b.value - a.value || a.currency.ticker.localeCompare(b.currency.ticker));
  for (const item of others) {
    options.push(assetOption(item.currency.id, item, formatFiat, formatCrypto));
  }

  return options;
}

export function tickerForFilter(
  filter: string,
  options: readonly PayCardBalanceFilterOption[],
): string | undefined {
  return options.find(option => option.id === filter)?.ticker;
}
