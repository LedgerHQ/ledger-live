import { useCallback } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export function useFiatFormatter(): (value: number) => string {
  const locale = useSelector(localeSelector);
  const unit = useSelector(counterValueCurrencySelector).units[0];

  return useCallback(
    (value: number): string =>
      formatCurrencyUnit(unit, new BigNumber(value), { locale, showCode: true }),
    [unit, locale],
  );
}
