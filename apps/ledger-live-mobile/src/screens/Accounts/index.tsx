import React, { useCallback, useState, useEffect, memo, useMemo } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { Account, TokenAccount } from "@ledgerhq/types-live";
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
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import { ScreenName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

import Spinning from "../../components/Spinning";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import AccountsNavigationHeader from "./AccountsNavigationHeader";

const List = globalSyncRefreshControl(FlatList);

type Props = {
  navigation: any;
  route: { params?: Params };
};

type Params = {
  currency?: string;
  search?: string;
  address?: string;
  currencyTicker?: string;
  currencyId?: string;
};

function Accounts({ navigation, route }: Props) {
  const accounts = useSelector(accountsSelector);
  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const { t } = useTranslation();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const syncPending = globalSyncState.pending && !isUpToDate;

  const { params } = route;

  const [account, setAccount] = useState<Account | undefined>(undefined);
  const flattenedAccounts = useMemo(
    () =>
      route?.params?.currencyId
        ? flattenAccounts(accounts, {
            enforceHideEmptySubAccounts: true,
          }).filter(
            (account: Account | TokenAccount) =>
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
              isForwardedFromAccounts: true,
            });
          }
        }
      }
    }
  }, [params, accounts, navigation, account]);

  const renderItem = useCallback(
    ({ item, index }: { item: Account | TokenAccount; index: number }) => (
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
          keyExtractor={(i: any) => i.id}
          ListHeaderComponent={
            <Flex mt={3} mb={3}>
              <Text variant="h4">
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
        <MigrateAccountsBanner />
        <TokenContextualModal
          onClose={() => setAccount(undefined)}
          isOpened={!!account}
          account={account}
        />
      </Flex>
    </TabBarSafeAreaView>
  );
}

export default memo(withDiscreetMode(Accounts));
