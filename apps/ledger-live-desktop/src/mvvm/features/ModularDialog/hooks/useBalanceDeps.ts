import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export const useBalanceDeps = () => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const state = useCountervaluesCache();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  return { flattenedAccounts, state, counterValueCurrency, locale };
};
