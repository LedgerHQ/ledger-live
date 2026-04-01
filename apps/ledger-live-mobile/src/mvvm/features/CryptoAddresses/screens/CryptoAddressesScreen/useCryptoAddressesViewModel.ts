import { useCallback, useMemo, useState } from "react";
import { useSelector } from "~/context/hooks";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/core";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { flattenAccountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { walletSelector } from "~/reducers/wallet";
import isEqual from "lodash/isEqual";
import { orderAccountsByFiatValue } from "@ledgerhq/live-countervalues/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react/index";
import { blacklistedTokenIdsSelector, counterValueCurrencySelector } from "~/reducers/settings";
import { useTranslation } from "~/context/Locale";

type NavigationProp = BaseNavigationComposite<
  StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.CryptoAddresses>
>;

export default function useCryptoAddressesViewModel(sourceScreenName?: ScreenName) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const allAccounts = useSelector(flattenAccountsSelector, isEqual);
  const walletState = useSelector(walletSelector, isEqual);
  const orderedAccounts = orderAccountsByFiatValue(allAccounts, countervalueState, toCurrency);
  const route = useRoute();

  const excludedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const accounts = useMemo(
    () =>
      orderedAccounts.filter(account => {
        if (account.type === "TokenAccount") {
          return !excludedTokenIds.includes(account.token.id);
        }
        return true;
      }),
    [orderedAccounts, excludedTokenIds],
  );

  const hasNoAccount = accounts.length === 0;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const isLoading = globalSyncState.pending && !isUpToDate;
  const error = globalSyncState.error;

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const onAddAccountPress = useCallback(() => {
    track("button_clicked", { button: "add a new account", page: route.name });
    setIsAddAccountOpen(true);
  }, [route.name]);

  const onCloseAddAccount = useCallback(() => setIsAddAccountOpen(false), []);

  const onAccountPress = useCallback(
    (account: Account | TokenAccount) => {
      const defaultAccountName = accountNameWithDefaultSelector(walletState, account);

      if (account.type === "Account") {
        track("account_clicked", {
          currency: account.currency.name,
          account: defaultAccountName,
          page: route.name,
        });
        navigation.navigate(ScreenName.Account, {
          accountId: account.id,
        });
      } else if (account.type === "TokenAccount") {
        track("account_clicked", {
          currency: account.token.parentCurrency.name,
          account: defaultAccountName,
          page: route.name,
        });
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Account,
          params: {
            currencyId: account.token.parentCurrency.id,
            parentId: account.parentId,
            accountId: account.id,
          },
        });
      }
    },
    [navigation, walletState, route.name],
  );

  return {
    accounts,
    hasNoAccount,
    isLoading,
    error,
    onAccountPress,
    onAddAccountPress,
    onCloseAddAccount,
    onNavigateBack: navigation.goBack,
    isAddAccountOpen,
    title: t("cryptoAddresses.title"),
    addAccountLabel: t("cryptoAddresses.addAccount"),
    emptyStateLabel: t("cryptoAddresses.emptyState"),
    trackingPage: route.name,
    sourceScreenName,
  };
}
