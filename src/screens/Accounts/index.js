// @flow

import React, { useCallback, useRef, useState, useEffect } from "react";
import { StyleSheet, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { useRefreshAccountsOrdering } from "../../actions/general";
import { accountsSelector } from "../../reducers/accounts";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import TrackScreen from "../../analytics/TrackScreen";

import NoAccounts from "./NoAccounts";
import AccountRow from "./AccountRow";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import { useScrollToTop } from "../../navigation/utils";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import { ScreenName } from "../../const";

const List = globalSyncRefreshControl(FlatList);

type Props = {
  navigation: any,
  route: { params?: { currency?: string } },
};

export default function Accounts({ navigation, route }: Props) {
  const accounts = useSelector(accountsSelector);
  const ref = useRef();
  useScrollToTop(ref);
  const { colors } = useTheme();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const { params } = route;

  const [account, setAccount] = useState(undefined);

  // Deep linking params redirect
  useEffect(() => {
    if (params) {
      if (params.currency) {
        const account = accounts.find(
          ({ currency }) => currency.family === params.currency,
        );

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
  }, [params, accounts, navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: Account, index: number }) => (
      <AccountRow
        navigation={navigation}
        account={item}
        accountId={item.id}
        onSetAccount={setAccount}
        isLast={index === accounts.length - 1}
      />
    ),
    [navigation, accounts.length],
  );

  if (accounts.length === 0) {
    return (
      <>
        <TrackScreen category="Accounts" accountsLength={0} />
        <NoAccounts navigation={navigation} />
      </>
    );
  }

  return (
    <>
      <TrackScreen category="Accounts" accountsLength={accounts.length} />
      <List
        ref={ref}
        data={accounts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={[styles.list, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      />
      <MigrateAccountsBanner />
      <TokenContextualModal
        onClose={() => setAccount(undefined)}
        isOpened={!!account}
        account={account}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});
