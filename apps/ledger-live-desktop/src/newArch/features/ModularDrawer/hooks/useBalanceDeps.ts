import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export const useBalanceDeps = () => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  return { flattenedAccounts, state, counterValueCurrency, locale };
};
