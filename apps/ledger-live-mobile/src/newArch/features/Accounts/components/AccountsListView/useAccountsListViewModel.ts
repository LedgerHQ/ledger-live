import type { FlashListProps } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import { useSelector } from "~/context/store";
import { useFocusEffect, useNavigation } from "@react-navigation/core";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { GestureResponderEvent } from "react-native";
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
import { blacklistedTokenIdsSelector, counterValueCurrencySelector } from "~/reducers/settings";
import { TrackingEvent } from "../../enums";

export interface Props {
  sourceScreenName?: ScreenName;
  isSyncEnabled?: boolean;
  limitNumberOfAccounts?: number;
  ListFooterComponent?: FlashListProps<unknown>["ListFooterComponent"];
  specificAccounts?: Account[] | TokenAccount[];
  onContentChange?: (width: number, height: number) => void;
}

export type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Assets>
  | StackNavigatorNavigation<PortfolioNavigatorStackParamList>
>;

const useAccountsListViewModel = ({
  isSyncEnabled = false,
  limitNumberOfAccounts,
  ListFooterComponent,
  specificAccounts,
  onContentChange,
}: Props) => {
  const navigation = useNavigation<NavigationProp>();
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const allAccounts = useSelector(flattenAccountsSelector, isEqual);
  const walletState = useSelector(walletSelector, isEqual);
  const accounts = specificAccounts || allAccounts;
  const orderedAccountsByValue = orderAccountsByFiatValue(accounts, countervalueState, toCurrency);

  const excludedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const filteredAccounts = useMemo(
    () =>
      orderedAccountsByValue.filter(account => {
        if (account.type === "TokenAccount") {
          return !excludedTokenIds.includes(account.token.id);
        }
        return true;
      }),
    [orderedAccountsByValue, excludedTokenIds],
  );

  const accountsToDisplay = filteredAccounts.slice(0, limitNumberOfAccounts);

  const pageTrackingEvent = specificAccounts
    ? TrackingEvent.AccountListSummary
    : TrackingEvent.AccountsList;

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const onAccountPress = useCallback(
    (account: Account | TokenAccount, _uiEvent: GestureResponderEvent) => {
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
    [navigation, walletState, pageTrackingEvent],
  );

  return {
    accountsToDisplay,
    limitNumberOfAccounts,
    ListFooterComponent,
    onAccountPress,
    isSyncEnabled,
    onContentChange,
  };
};

export default useAccountsListViewModel;
