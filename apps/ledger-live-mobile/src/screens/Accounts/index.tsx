import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, FlatListProps, ListRenderItemInfo } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import { RefreshMedium } from "@ledgerhq/native-ui/assets/icons";

import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { useTranslation } from "react-i18next";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useRefreshAccountsOrdering } from "../../actions/general";
import { accountsSelector, isUpToDateSelector } from "../../reducers/accounts";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import TrackScreen from "../../analytics/TrackScreen";

import AccountRow from "./AccountRow";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import { ScreenName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

import Spinning from "../../components/Spinning";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import AccountsNavigationHeader from "./AccountsNavigationHeader";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "../../components/RootNavigator/types/AccountsNavigator";

const List = globalSyncRefreshControl(
  FlatList as React.ComponentType<FlatListProps<AccountLike>>,
);

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Accounts>
>;

function Accounts({ navigation, route }: NavigationProps) {
  const accounts = useSelector(accountsSelector);
  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const { t } = useTranslation();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const syncPending = globalSyncState.pending && !isUpToDate;

  const { params } = route;

  const [account, setAccount] = useState<Account | TokenAccount | undefined>(
    undefined,
  );
  const flattenedAccounts = useMemo(
    () =>
      route?.params?.currencyId
        ? flattenAccounts(accounts, {
            enforceHideEmptySubAccounts: true,
          }).filter(
            (account: AccountLike) =>
              getAccountCurrency(account).id === route?.params?.currencyId,
          )
        : flattenAccounts(accounts, {
            enforceHideEmptySubAccounts: true,
          }),
    [accounts, route?.params?.currencyId],
  );

  // Deep linking params redirect
  useEffect(() => {
    if (params) {
      if (params.currency) {
        const currency = findCryptoCurrencyByKeyword(
          params.currency.toUpperCase(),
        );
        if (currency) {
          const account = params.address
            ? accounts.find(
                acc =>
                  acc.currency.id === currency.id &&
                  acc.freshAddress === params.address,
              )
            : null;

          if (account) {
            navigation.replace(ScreenName.Account, {
              accountId: account.id,
            });
          } else {
            navigation.replace(ScreenName.Asset, {
              currency,
            });
          }
        }
      }
    }
  }, [params, accounts, navigation, account]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AccountLike>) => (
      <AccountRow
        navigation={navigation}
        account={item}
        accountId={item.id}
        onSetAccount={setAccount}
        isLast={index === flattenedAccounts.length - 1}
        topLink={!params?.currencyId && item.type === "TokenAccount"}
        bottomLink={
          !params?.currencyId &&
          flattenedAccounts[index + 1]?.type === "TokenAccount"
        }
        sourceScreenName={ScreenName.Accounts}
      />
    ),
    [navigation, flattenedAccounts, params?.currencyId],
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="Accounts" accountsLength={accounts.length} />
      <Flex flex={1} bg={"background.main"}>
        <AccountsNavigationHeader currencyId={params?.currencyId} />
        {syncPending && (
          <Flex flexDirection={"row"} alignItems={"center"} px={6} my={3}>
            <Spinning clockwise>
              <RefreshMedium size={20} color={"neutral.c80"} />
            </Spinning>
            <Text color={"neutral.c80"} ml={2}>
              {t("portfolio.syncPending")}
            </Text>
          </Flex>
        )}
        <List
          data={flattenedAccounts}
          renderItem={renderItem}
          keyExtractor={(i: AccountLike) => i.id}
          ListHeaderComponent={
            <Flex mt={3} mb={3}>
              <Text testID="accounts-list-title" variant="h4">
                {params?.currencyTicker
                  ? t("accounts.cryptoAccountsTitle", {
                      currencyTicker: params?.currencyTicker,
                    })
                  : t("accounts.title")}
              </Text>
            </Flex>
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: TAB_BAR_SAFE_HEIGHT,
          }}
        />
        <TokenContextualModal
          onClose={() => setAccount(undefined)}
          isOpened={!!account}
          account={account as TokenAccount}
        />
      </Flex>
    </TabBarSafeAreaView>
  );
}

export default memo(withDiscreetMode(Accounts));
