import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@domain/entity-currency-unit";
import { PAY_CARD_BALANCE_FILTER_ALL } from "@domain/entity-pay-card";
import type { PayCardBalanceFilterOption } from "@features/flow-pay-card-balance";
import type { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import type { DefaultStablecoin } from "./usePayStablecoins";

function formatCrypto(unit: Unit, balance: number, locale: string): string {
  return formatCurrencyUnit(unit, new BigNumber(balance), { locale, showCode: true });
}

function assetOption(
  id: string,
  item: CategorizedAssetItem,
  locale: string,
  formatFiat: (value: number) => string,
  override?: Pick<DefaultStablecoin, "name" | "ticker">,
): PayCardBalanceFilterOption {
  return {
    id,
    title: override?.name ?? item.currency.name,
    ticker: override?.ticker ?? item.currency.ticker,
    ledgerId: id,
    countervalue: item.value,
    countervalueLabel: formatFiat(item.value),
    cryptoAmountLabel: formatCrypto(item.currency.units[0], item.balance, locale),
  };
}

export function buildBalanceFilterOptions({
  stablecoins,
  defaultStablecoins,
  allLabel,
  locale,
  counterValueUnit,
}: Readonly<{
  stablecoins: readonly CategorizedAssetItem[];
  defaultStablecoins: readonly DefaultStablecoin[];
  allLabel: string;
  locale: string;
  counterValueUnit: Unit;
}>): PayCardBalanceFilterOption[] {
  const formatFiat = (value: number): string =>
    formatCurrencyUnit(counterValueUnit, new BigNumber(value), { locale, showCode: true });

  const byTicker = new Map<string, CategorizedAssetItem>();
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
      options.push(assetOption(coin.id, held, locale, formatFiat, coin));
    } else {
      const unit: Unit = { name: coin.name, code: coin.ticker, magnitude: coin.magnitude };
      options.push({
        id: coin.id,
        title: coin.name,
        ticker: coin.ticker,
        ledgerId: coin.id,
        countervalue: 0,
        countervalueLabel: formatFiat(0),
        cryptoAmountLabel: formatCrypto(unit, 0, locale),
      });
    }
  }

  const others = stablecoins
    .filter(item => !defaultTickers.has(item.currency.ticker.toUpperCase()))
    .sort((a, b) => b.value - a.value || a.currency.ticker.localeCompare(b.currency.ticker));
  for (const item of others) {
    options.push(assetOption(item.currency.id, item, locale, formatFiat));
  }

  return options;
}

export function tickerForFilter(
  filter: string,
  options: readonly PayCardBalanceFilterOption[],
): string | undefined {
  return options.find(option => option.id === filter)?.ticker;
}
