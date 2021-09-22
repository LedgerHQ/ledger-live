// @flow
import React, { memo, useState, useCallback } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/lib/account/groupOperations";
import { isAccountEmpty } from "@ledgerhq/live-common/lib/account/helpers";

import { Trans } from "react-i18next";
import { useRefreshAccountsOrdering } from "../../actions/general";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";

import NoOperationFooter from "../../components/NoOperationFooter";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";

import EmptyStatePortfolio from "./EmptyStatePortfolio";
import NoOpStatePortfolio from "./NoOpStatePortfolio";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import LoadingFooter from "../../components/LoadingFooter";
import Button from "../../components/Button";
import { ScreenName } from "../../const";

type Props = {
  navigation: any,
};

export function PortfolioHistoryList({
  onEndReached,
  opCount = 10,
  navigation,
}: {
  onEndReached?: () => void,
  opCount?: number,
  navigation: any,
}) {
  const accounts = useSelector(accountsSelector);
  const allAccounts = useSelector(flattenAccountsSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
  });

  function ListEmptyComponent() {
    if (accounts.length === 0) {
      return <EmptyStatePortfolio navigation={navigation} />;
    }

    if (accounts.every(isAccountEmpty)) {
      return <NoOpStatePortfolio />;
    }

    return null;
  }

  function keyExtractor(item: Operation) {
    return item.id;
  }

  function renderItem({
    item,
    index,
    section,
  }: {
    item: Operation,
    index: number,
    section: SectionBase<*>,
  }) {
    const account = allAccounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type !== "Account"
        ? accounts.find(a => a.id === account.parentId)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
        account={account}
        multipleAccounts
        isLast={section.data.length - 1 === index}
      />
    );
  }

  function renderSectionHeader({ section }: { section: { day: Date } }) {
    return <SectionHeader section={section} />;
  }

  const onTransactionButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.PortfolioOperationHistory);
  }, [navigation]);

  return (
    <SectionList
      // $FlowFixMe
      sections={sections}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      // $FlowFixMe
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
      onEndReached={onEndReached}
      ListFooterComponent={
        !completed ? (
          !onEndReached ? (
            <View style={styles.seeMoreBtn}>
              <Button
                event="View Transactions"
                type="lightPrimary"
                title={<Trans i18nKey="common.seeAll" />}
                onPress={onTransactionButtonPress}
              />
            </View>
          ) : (
            <LoadingFooter />
          )
        ) : accounts.every(isAccountEmpty) ? null : sections.length ? (
          <NoMoreOperationFooter />
        ) : (
          <NoOperationFooter />
        )
      }
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

function PortfolioHistory({ navigation }: Props) {
  const [opCount, setOpCount] = useState(50);

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  return (
    <PortfolioHistoryList
      navigation={navigation}
      opCount={opCount}
      onEndReached={onEndReached}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  seeMoreBtn: {
    margin: 16,
  },
});

export default memo<Props>(PortfolioHistory);
