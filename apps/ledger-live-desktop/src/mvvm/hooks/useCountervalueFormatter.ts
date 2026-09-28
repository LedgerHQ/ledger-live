import { useCallback } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@features/flow-pay-card-details";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export function useCountervalueFormatter(): (value: number) => FormattedValue {
  const locale = useSelector(localeSelector);
  const unit = useSelector(counterValueCurrencySelector).units[0];

  return useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), { locale, showCode: true }),
    [unit, locale],
  );
}
