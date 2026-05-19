import { useCallback, useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { RANGES } from "LLM/features/Market/utils";
import { rangeDataTable } from "@ledgerhq/live-common/cg-client/utils/rangeDataTable";
import { useTranslation, useLocale } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { RANGE_TO_PRICE_CHANGE_KEY, type RangeKey } from "../../utils/rangeMapping";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";

export function useBalanceGraphViewModel(
  currency?: AssetDetailCurrencyProps,
  hideReceive?: boolean,
) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterValueUnit = counterValueCurrency.units[0];
  const { marketCurrency, isLoading } = useAssetMarketData(currency);

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
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(
        counterValueUnit,
        new BigNumber(value).times(new BigNumber(10).pow(counterValueUnit.magnitude)),
        { locale, showCode: true },
      ),
    [counterValueUnit, locale],
  );

  const formattedPriceChange = useMemo(() => {
    if (priceChangePercentage == null || price == null) return undefined;
    const changeValue = Math.abs(price * (priceChangePercentage / 100));
    const sign = priceChangePercentage >= 0 ? "+" : "-";
    const formatted = formatCurrencyUnit(
      counterValueUnit,
      new BigNumber(changeValue).times(new BigNumber(10).pow(counterValueUnit.magnitude)),
      { locale, showCode: true },
    );
    return `${sign}${formatted}`;
  }, [priceChangePercentage, price, locale, counterValueUnit]);

  const rangeTimeLabel = t(`assetDetail.balanceGraph.timeLabel.${range}`);

  const accounts = useSelector(shallowAccountsSelector);

  const showReceive = useMemo(() => {
    if (hideReceive || !currency) return false;
    const hasAssetFunds = accounts.some(a => a.currency.id === currency.id && a.balance.gt(0));
    const hasFundsElsewhere = accounts.some(a => a.currency.id !== currency.id && a.balance.gt(0));
    return !hasAssetFunds && hasFundsElsewhere;
  }, [hideReceive, accounts, currency]);

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
