// @flow

import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, FlatList } from "react-native";
import { useSelector } from "react-redux";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { accountsSelector } from "../../reducers/accounts";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import TrackScreen from "../../analytics/TrackScreen";

import NoAccounts from "./NoAccounts";
import AccountRow from "./AccountRow";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import { useScrollToTop } from "../../navigation/utils";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";

const List = globalSyncRefreshControl(FlatList);

type Props = {
  navigation: any,
};

export default function Accounts({ navigation }: Props) {
  const accounts = useSelector(accountsSelector);
  const ref = useRef();
  useScrollToTop(ref);

  const [account, setAccount] = useState(undefined);

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
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
      />
      <MigrateAccountsBanner />
      <TokenContextualModal
        onClose={() => setAccount(undefined)}
        isOpened={account}
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
