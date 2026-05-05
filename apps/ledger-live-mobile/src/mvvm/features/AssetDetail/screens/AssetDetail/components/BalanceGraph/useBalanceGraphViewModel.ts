import { useCallback, useMemo, useState } from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { RANGES } from "LLM/features/Market/utils";
import { rangeDataTable } from "@ledgerhq/live-common/cg-client/utils/rangeDataTable";
import { useTranslation, useLocale } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { parseCurrencyString } from "../../utils/currencyFormatter";
import { RANGE_TO_PRICE_CHANGE_KEY, type RangeKey } from "../../utils/rangeMapping";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";

export function useBalanceGraphViewModel(currency: CryptoCurrency | undefined) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { marketCurrency, counterCurrency, isLoading } = useAssetMarketData(currency);

  const [range, setRange] = useState<RangeKey>("24h");

  const ranges = useMemo(
    () =>
      RANGES.map(r => ({
        label: t(`market.range.${rangeDataTable[r].label}`),
        value: r,
      })).reverse(),
    [t],
  );

  const isRangeKey = (value: string): value is RangeKey => value in RANGE_TO_PRICE_CHANGE_KEY;

  const onRangeChange = useCallback(
    (value: string) => {
      if (value !== range && isRangeKey(value)) {
        setRange(value);
        track("button_clicked", {
          button: "timeframe",
          timeframe: value,
          page: "Asset Detail",
          currency: currency?.id,
        });
      }
    },
    [range, currency?.id],
  );

  const price = marketCurrency?.price;
  const priceChangePercentage =
    marketCurrency?.priceChangePercentage[RANGE_TO_PRICE_CHANGE_KEY[range]];

  const priceFormatter = useCallback(
    (value: number): FormattedValue => {
      const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: counterCurrency,
        numberingSystem: "latn",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

      return parseCurrencyString(formatted, locale);
    },
    [locale, counterCurrency],
  );

  const formattedPriceChange = useMemo(() => {
    if (priceChangePercentage == null || price == null) return undefined;
    const changeValue = Math.abs(price * (priceChangePercentage / 100));
    const sign = priceChangePercentage >= 0 ? "+" : "-";
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: counterCurrency,
      numberingSystem: "latn",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(changeValue);
    return `${sign}${formatted}`;
  }, [priceChangePercentage, price, locale, counterCurrency]);

  const rangeTimeLabel = t(`assetDetail.balanceGraph.timeLabel.${range}`);

  const accounts = useSelector(shallowAccountsSelector);

  const showReceive = useMemo(() => {
    if (!currency) return false;
    const hasAssetFunds = accounts.some(a => a.currency.id === currency.id && a.balance.gt(0));
    const hasFundsElsewhere = accounts.some(a => a.currency.id !== currency.id && a.balance.gt(0));
    return !hasAssetFunds && hasFundsElsewhere;
  }, [accounts, currency]);

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency,
    sourceScreenName: "Asset Detail",
  });

  const onReceivePress = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      page: "Asset Detail",
      currency: currency?.id,
    });
    handleOpenReceiveDrawer();
  }, [handleOpenReceiveDrawer, currency?.id]);

  return {
    price: price ?? 0,
    priceFormatter,
    hasMarketData: price != null,
    priceChangePercentage: priceChangePercentage ?? 0,
    formattedPriceChange,
    rangeTimeLabel,
    ranges,
    selectedRange: range,
    onRangeChange,
    showReceive,
    onReceivePress,
    isLoading,
  };
}
