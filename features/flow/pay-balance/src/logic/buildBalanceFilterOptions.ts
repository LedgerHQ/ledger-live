import type { Unit } from "@domain/entity-currency-unit";
import { PAY_CARD_BALANCE_FILTER_ALL } from "../state";
import type { BalanceFilterOption } from "../types";

/** Always-offered stablecoin (USDC/USDT), taken from the top of the market-cap list. */
export type DefaultStablecoin = Readonly<{
  id: string;
  ticker: string;
  name: string;
  magnitude: number;
}>;

/** Minimal held-stablecoin shape consumed by {@link buildBalanceFilterOptions}. */
export type StablecoinItem = Readonly<{
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
  stablecoins: readonly StablecoinItem[];
  defaultStablecoins: readonly DefaultStablecoin[];
  allLabel: string;
  /** Formats a fiat countervalue, e.g. `(1000) => "$1,000.00"`. */
  formatFiat: (value: number) => string;
  /** Formats a crypto amount for a unit, e.g. `(usdcUnit, 1_000_000_000) => "1,000.00 USDC"`. */
  formatCrypto: (unit: Unit, balance: number) => string;
}>;

function assetOption(
  item: StablecoinItem,
  formatFiat: (value: number) => string,
  formatCrypto: (unit: Unit, balance: number) => string,
): BalanceFilterOption {
  return {
    id: item.currency.id,
    title: item.currency.name,
    ticker: item.currency.ticker,
    ledgerId: item.currency.id,
    countervalue: item.value,
    countervalueLabel: formatFiat(item.value),
    cryptoAmountLabel: formatCrypto(item.currency.units[0], item.balance),
  };
}

function zeroDefaultOption(
  coin: DefaultStablecoin,
  formatFiat: (value: number) => string,
  formatCrypto: (unit: Unit, balance: number) => string,
): BalanceFilterOption {
  const unit: Unit = { name: coin.name, code: coin.ticker, magnitude: coin.magnitude };
  return {
    id: coin.id,
    title: coin.name,
    ticker: coin.ticker,
    ledgerId: coin.id,
    countervalue: 0,
    countervalueLabel: formatFiat(0),
    cryptoAmountLabel: formatCrypto(unit, 0),
  };
}

export function buildBalanceFilterOptions({
  stablecoins,
  defaultStablecoins,
  allLabel,
  formatFiat,
  formatCrypto,
}: BuildBalanceFilterOptionsParams): BalanceFilterOption[] {
  const unfilteredTotal = stablecoins.reduce((total, { value }) => total + value, 0);
  const heldIds = new Set(stablecoins.map(item => item.currency.id));
  const held = [...stablecoins].sort(
    (a, b) => b.value - a.value || a.currency.name.localeCompare(b.currency.name),
  );

  const options: BalanceFilterOption[] = [
    {
      id: PAY_CARD_BALANCE_FILTER_ALL,
      title: allLabel,
      countervalue: unfilteredTotal,
      countervalueLabel: formatFiat(unfilteredTotal),
    },
    ...held.map(item => assetOption(item, formatFiat, formatCrypto)),
  ];

  for (const coin of defaultStablecoins) {
    if (heldIds.has(coin.id)) continue;
    options.push(zeroDefaultOption(coin, formatFiat, formatCrypto));
  }

  return options;
}
