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
import { useTranslation } from "~/context/Locale";
import BigNumber from "bignumber.js";
import {
  computeAggregatedAccountsData,
  type AggregatedAccountEntry,
  type CalculateCountervalue,
} from "@ledgerhq/asset-aggregation/index";

export type { AggregatedAccountEntry };

type NavigationProp = BaseNavigationComposite<
  StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.CryptoAddresses>
>;

export default function useCryptoAddressesViewModel(sourceScreenName?: ScreenName) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const allAccounts = useSelector(accountsSelector, isEqual);

  const aggregatedAccountsData = useMemo(() => {
    const calculateCv: CalculateCountervalue = (from, value) => {
      const raw = calculate(countervalueState, {
        value: value.toNumber(),
        from,
        to: toCurrency,
        disableRounding: true,
      });
      return raw != null ? new BigNumber(raw) : undefined;
    };
    return computeAggregatedAccountsData(allAccounts, calculateCv);
  }, [allAccounts, countervalueState, toCurrency]);

  const accounts = useMemo((): Account[] => {
    return [...allAccounts].sort((a, b) => {
      const aCV = aggregatedAccountsData.get(a.id)?.countervalue ?? new BigNumber(0);
      const bCV = aggregatedAccountsData.get(b.id)?.countervalue ?? new BigNumber(0);
      return bCV.comparedTo(aCV);
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
