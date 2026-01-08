import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";

export const useBalanceDeps = () => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  return { flattenedAccounts, state, counterValueCurrency, locale };
};
