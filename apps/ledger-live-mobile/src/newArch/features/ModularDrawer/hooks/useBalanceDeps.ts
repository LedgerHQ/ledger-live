import { useMemo } from "react";
import { useSelector } from "react-redux";
import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { accountsSelector } from "~/reducers/accounts";
import { discreetModeSelector, localeSelector } from "~/reducers/settings";
import { useCounterValueCurrency } from "~/hooks/useCounterValueCurrency";

export const useBalanceDeps = () => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useCounterValueCurrency();
  const locale = useSelector(localeSelector);

  // Use fallback currency if not loaded yet
  const fallbackCurrency = {
    type: "FiatCurrency" as const,
    ticker: "USD",
    name: "USD",
    symbol: "USD",
    units: [
      {
        code: "USD",
        name: "USD",
        magnitude: 2,
        showAllDigits: true,
        prefixCode: true,
      },
    ],
  };

  return {
    flattenedAccounts,
    discreet,
    state,
    counterValueCurrency: counterValueCurrency || fallbackCurrency,
    locale,
  };
};
