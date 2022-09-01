import React, { useCallback, useState, useEffect, memo, useMemo } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import { RefreshMedium } from "@ledgerhq/native-ui/assets/icons";

import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { Trans, useTranslation } from "react-i18next";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import { useRefreshAccountsOrdering } from "../../actions/general";
import { accountsSelector, isUpToDateSelector } from "../../reducers/accounts";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import TrackScreen from "../../analytics/TrackScreen";
import NoResultsFound from "../../icons/NoResultsFound";

import NoAccounts from "./NoAccounts";
import AccountRow from "./AccountRow";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import { ScreenName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

import FilteredSearchBar from "../../components/FilteredSearchBar";
import Spinning from "../../components/Spinning";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import AccountsNavigationHeader from "./AccountsNavigationHeader";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

const List = globalSyncRefreshControl(FlatList);

type Props = {
  navigation: any;
  route: {
    params?: {
      currency?: string;
      search?: string;
      currencyTicker?: string;
      currencyId?: string;
    };
  };
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

  const search = params?.search;

  const [account, setAccount] = useState<Account | undefined>(undefined);
  const flattenedAccounts = useMemo(
    () =>
      route?.params?.currencyId
        ? flattenAccounts(accounts, {
            enforceHideEmptySubAccounts: true,
          }).filter(
            account =>
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
          const account = accounts.find(acc => acc.currency.id === currency.id);

          if (account) {
            // reset params so when we come back the redirection doesn't loop
            navigation.setParams({ ...params, currency: undefined });
            navigation.navigate(ScreenName.Account, {
              accountId: account.id,
              isForwardedFromAccounts: true,
            });
          }
        }
      }
    }
  }, [params, accounts, navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: Account | TokenAccount; index: number }) => (
      <AccountRow
        navigation={navigation}
        account={item}
        accountId={item.id}
        onSetAccount={setAccount}
        isLast={index === flattenedAccounts.length - 1}
        topLink={!route.params?.currencyId && item.type === "TokenAccount"}
        bottomLink={
          !route.params?.currencyId &&
          flattenedAccounts[index + 1]?.type === "TokenAccount"
        }
      />
    ),
    [navigation, flattenedAccounts],
  );

  const renderList = useCallback(
    items => (
      <List
        data={items}
        renderItem={renderItem}
        keyExtractor={(i: any) => i.id}
        ListEmptyComponent={<NoAccounts />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: TAB_BAR_SAFE_HEIGHT,
        }}
      />
    ),
    [renderItem],
  );

  const renderEmptySearch = useCallback(
    () => (
      <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
        <NoResultsFound />
        <Text
          color="neutral.c100"
          fontWeight="medium"
          variant="h2"
          mt={6}
          textAlign="center"
        >
          <Trans i18nKey="accounts.noResultsFound" />
        </Text>
        <Flex>
          <Text
            color="neutral.c80"
            fontWeight="medium"
            variant="body"
            pt={6}
            textAlign="center"
          >
            <Trans i18nKey="accounts.noResultsDesc" />
          </Text>
        </Flex>
      </Flex>
    ),
    [],
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="Accounts" accountsLength={accounts.length} />
      <Flex flex={1} bg={"background.main"}>
        <AccountsNavigationHeader
          currencyTicker={route?.params?.currencyTicker}
          currencyId={route.params?.currencyId}
        />
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

        <FilteredSearchBar
          list={flattenedAccounts}
          inputWrapperStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
          renderList={renderList}
          renderEmptySearch={renderEmptySearch}
          keys={SEARCH_KEYS}
          initialQuery={search}
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
