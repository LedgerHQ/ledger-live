import { useCallback } from "react";
import type { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import type { StakePositionAmount } from "@features/flow-stake-position";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";

export type StakePositionAmountFormatter = (value: BigNumber) => StakePositionAmount;

/** Formats an amount of the account in its unit, and in fiat when a rate is known. */
export function useStakePositionAmountFormatter(account: Account): StakePositionAmountFormatter {
  const unit = useAccountUnit(account);
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const { currency } = account;

  return useCallback(
    value => {
      const countervalue = calculateCountervalue(currency, value);
      const options = { showCode: true, locale, discreet };
      return {
        crypto: formatCurrencyUnit(unit, value, options),
        fiat: countervalue
          ? formatCurrencyUnit(counterValueCurrency.units[0], countervalue, options)
          : undefined,
      };
    },
    [calculateCountervalue, currency, unit, locale, discreet, counterValueCurrency],
  );
}
