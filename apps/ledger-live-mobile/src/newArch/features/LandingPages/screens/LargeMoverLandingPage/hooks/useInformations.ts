import { ValueChange } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { InformationsProps } from "../types";
import { useDateFormat } from "./useDateFormat";

export function useInformations(props: InformationsProps) {
  const { price, allTimeHighDate, allTimeLowDate, allTimeHigh, allTimeLow, marketCapPercent } =
    props;

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

  const athDate = allTimeHighDate ? new Date(allTimeHighDate) : null;
  const atlDate = allTimeLowDate ? new Date(allTimeLowDate) : null;

  const percentChangeMkt24h: ValueChange = {
    value: marketCapPercent,
    percentage: marketCapPercent,
  };

  return {
    athDate,
    atlDate,
    percentChangeATH,
    percentChangeATL,
    percentChangeMkt24h,
    counterValueCurrency,
    dateFormatter,
    locale,
    t,
  };
}
