import { useMemo } from "react";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import type { StakePositionFormatter } from "@features/flow-stake-position";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";

/** The account's unit, the locale, the counter value and discreet mode, for the package's figures. */
export function useStakePositionFormatter(account: Account): StakePositionFormatter {
  const unit = useAccountUnit(account);
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const { currency } = account;

  return useMemo(() => {
    const fiatUnit = counterValueCurrency.units[0];
    const options = { showCode: true, discreet, locale };
    const countervalueOf = (baseUnits: string) =>
      calculateCountervalue(currency, new BigNumber(baseUnits));
    const formatHeadline = (value: number) =>
      formatCurrencyUnitFragment(fiatUnit, new BigNumber(value), { locale, showCode: true });
    const percentFormat = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 2,
    });

    return {
      amount: baseUnits => {
        const countervalue = countervalueOf(baseUnits);
        return {
          crypto: formatCurrencyUnit(unit, new BigNumber(baseUnits), options),
          fiat: countervalue ? formatCurrencyUnit(fiatUnit, countervalue, options) : undefined,
        };
      },
      rewardsHeadline: baseUnits => {
        const countervalue = countervalueOf(baseUnits);
        return countervalue
          ? { value: countervalue.toNumber(), formatter: formatHeadline, hidden: discreet }
          : undefined;
      },
      percent: fraction => percentFormat.format(fraction),
    };
  }, [calculateCountervalue, counterValueCurrency, currency, discreet, locale, unit]);
}
