import { ValueChange } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { InformationsProps } from "../types";
import { useDateFormat } from "./useDateFormat";

export function useInformations(props: InformationsProps) {
  const {
    price = 0,
    allTimeHighDate,
    allTimeLowDate,
    allTimeHigh = 0,
    allTimeLow = 0,
    marketCap,
    totalVolume,
    fullyDilutedValuation,
    circulatingSupply = 0,
    totalSupply = 0,
    ticker,
  } = props;

  const { dateFormatter, locale } = useDateFormat();
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const percentChangeATH: ValueChange = useMemo(
    () => ({
      value: price - allTimeHigh,
      percentage: ((price - allTimeHigh) / allTimeHigh) * 100,
    }),
    [price, allTimeHigh],
  );

  const percentChangeATL: ValueChange = useMemo(
    () => ({
      value: price - allTimeLow,
      percentage: ((price - allTimeLow) / allTimeLow) * 100,
    }),
    [price, allTimeLow],
  );

  const athDate = useMemo(
    () => (allTimeHighDate ? new Date(allTimeHighDate) : null),
    [allTimeHighDate],
  );
  const atlDate = useMemo(
    () => (allTimeLowDate ? new Date(allTimeLowDate) : null),
    [allTimeLowDate],
  );

  const marketCapVolume24h = useMemo(
    () => (totalVolume ? (totalVolume / (marketCap ?? 1)) * 10000 : 0),
    [totalVolume, marketCap],
  );

  return {
    athDate,
    atlDate,
    percentChangeATH,
    percentChangeATL,
    counterValueCurrency,
    dateFormatter,
    locale,
    t,
    marketCapVolume24h,
    totalVolume,
    fullyDilutedValuation,
    circulatingSupply,
    totalSupply,
    ticker,
    marketCap,
    allTimeHigh,
    allTimeLow,
  };
}
