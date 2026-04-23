import { useCallback, useMemo, useState } from "react";
import { useSelector } from "~/context/hooks";
import { useFocusEffect, useNavigation } from "@react-navigation/core";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { accountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { Account } from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react/index";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { listSubAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useTranslation } from "~/context/Locale";
import BigNumber from "bignumber.js";

type NavigationProp = BaseNavigationComposite<
  StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.CryptoAddresses>
>;

export type AggregatedAccountEntry = {
  countervalue: BigNumber;
  subAccountsCount: number;
};

export default function useCryptoAddressesViewModel(sourceScreenName?: ScreenName) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const allAccounts = useSelector(accountsSelector, isEqual);

  const aggregatedAccountsData = useMemo((): Map<string, AggregatedAccountEntry> => {
    const map = new Map<string, AggregatedAccountEntry>();
    for (const account of allAccounts) {
      const mainCv = calculate(countervalueState, {
        value: account.balance.toNumber(),
        from: account.currency,
        to: toCurrency,
        disableRounding: true,
      });
      let countervalue = new BigNumber(mainCv ?? 0);

      const subs = listSubAccounts(account);
      for (const sub of subs) {
        const subCv = calculate(countervalueState, {
          value: sub.balance.toNumber(),
          from: getAccountCurrency(sub),
          to: toCurrency,
          disableRounding: true,
        });
        countervalue = countervalue.plus(subCv ?? 0);
      }

      map.set(account.id, { countervalue, subAccountsCount: subs.length });
    }
    return map;
  }, [allAccounts, countervalueState, toCurrency]);

  const accounts = useMemo((): Account[] => {
    return [...allAccounts].sort((a, b) => {
      const aCV = aggregatedAccountsData.get(a.id)?.countervalue ?? new BigNumber(0);
      const bCV = aggregatedAccountsData.get(b.id)?.countervalue ?? new BigNumber(0);
      return bCV.minus(aCV).toNumber();
    });
  }, [allAccounts, aggregatedAccountsData]);

  const hasNoAccount = accounts.length === 0;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const isLoading = globalSyncState.pending && !isUpToDate;
  const error = globalSyncState.error;

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const onAddAccountPress = useCallback(() => {
    track("button_clicked", { button: "add_account", page: ScreenName.Accounts });
    setIsAddAccountOpen(true);
  }, []);

  const onCloseAddAccount = useCallback(() => setIsAddAccountOpen(false), []);

  const onAccountPress = useCallback(
    (account: Account) => {
      track("account_clicked", {
        currency: account.currency.name,
        page: ScreenName.Accounts,
      });
      navigation.navigate(ScreenName.Account, {
        accountId: account.id,
      });
    },
    [navigation],
  );

  return {
    accounts,
    aggregatedAccountsData,
    hasNoAccount,
    isLoading,
    error,
    onAccountPress,
    onAddAccountPress,
    onCloseAddAccount,
    isAddAccountOpen,
    addAccountLabel: t("cryptoAddresses.addAccount"),
    emptyStateLabel: t("cryptoAddresses.emptyState"),
    trackingPage: ScreenName.Accounts,
    sourceScreenName,
  };
}
