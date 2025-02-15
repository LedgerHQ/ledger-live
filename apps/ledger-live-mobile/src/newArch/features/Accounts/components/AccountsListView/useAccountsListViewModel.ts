import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect, useNavigation } from "@react-navigation/core";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { accountsSelector } from "~/reducers/accounts";
import { GestureResponderEvent, useStartProfiler } from "@shopify/react-native-performance";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { walletSelector } from "~/reducers/wallet";
import isEqual from "lodash/isEqual";
import { orderAccountsByFiatValue } from "@ledgerhq/live-countervalues/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react/index";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { TrackingEvent } from "../../enums";

export interface Props {
  sourceScreenName?: ScreenName;
  isSyncEnabled?: boolean;
  limitNumberOfAccounts?: number;
  specificAccounts?: Account[] | TokenAccount[];
  onContentChange?: (width: number, height: number) => void;
}

export type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Assets>
  | StackNavigatorNavigation<PortfolioNavigatorStackParamList>
>;

const useAccountsListViewModel = ({
  sourceScreenName,
  isSyncEnabled = false,
  limitNumberOfAccounts,
  specificAccounts,
  onContentChange,
}: Props) => {
  const startNavigationTTITimer = useStartProfiler();
  const navigation = useNavigation<NavigationProp>();
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const allAccounts = useSelector(accountsSelector, isEqual);
  const walletState = useSelector(walletSelector, isEqual);
  const accounts = specificAccounts || allAccounts;
  const orderedAccountsByValue = orderAccountsByFiatValue(accounts, countervalueState, toCurrency);

  const accountsToDisplay = orderedAccountsByValue.slice(0, limitNumberOfAccounts);

  const pageTrackingEvent = specificAccounts
    ? TrackingEvent.AccountListSummary
    : TrackingEvent.AccountsList;

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const onAccountPress = useCallback(
    (account: Account | TokenAccount, uiEvent: GestureResponderEvent) => {
      startNavigationTTITimer({ source: sourceScreenName, uiEvent });

      const defaultAccountName = accountNameWithDefaultSelector(walletState, account);

      if (account.type === "Account") {
        track("account_clicked", {
          currency: account.currency.name,
          account: defaultAccountName,
          page: pageTrackingEvent,
        });
        navigation.navigate(ScreenName.Account, {
          accountId: account.id,
        });
      } else if (account.type === "TokenAccount") {
        track("account_clicked", {
          currency: account.token.parentCurrency.name,
          account: defaultAccountName,
          page: pageTrackingEvent,
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
    [navigation, sourceScreenName, startNavigationTTITimer, walletState, pageTrackingEvent],
  );

  return {
    accountsToDisplay,
    limitNumberOfAccounts,
    onAccountPress,
    isSyncEnabled,
    onContentChange,
  };
};

export default useAccountsListViewModel;
