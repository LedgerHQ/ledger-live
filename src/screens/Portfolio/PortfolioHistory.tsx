// @flow
import React, { memo, useState, useCallback } from "react";
import { SectionList } from "react-native";
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
import { withDiscreetMode } from "../../context/DiscreetModeContext";

type Props = {
  navigation: any,
};

export const PortfolioHistoryList = withDiscreetMode(({
  onEndReached,
  opCount = 5,
  navigation,
}: {
  onEndReached?: () => void,
  opCount?: number,
  navigation: any,
}) => {
  const accounts = useSelector(accountsSelector);
  const allAccounts = useSelector(flattenAccountsSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
  });

  function ListEmptyComponent() {
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
    section: SectionBase<any>,
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
      style={{ flex: 1, paddingHorizontal: 16 }}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      // $FlowFixMe
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
      onEndReached={onEndReached}
      ListFooterComponent={
        !completed ? (
          !onEndReached ? (
              <Button
                event="View Transactions"
                type="main"
                mt={6}
                title={<Trans i18nKey="common.seeAll" />}
                onPress={onTransactionButtonPress}
              />
          ) : (
            <LoadingFooter />
          )
        ) : accounts.every(isAccountEmpty) ? null : sections.length ? (
          <NoMoreOperationFooter />
        ) : (
          null
        )
      }
      ListEmptyComponent={ListEmptyComponent}
    />
  );
})

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

export default memo<Props>(PortfolioHistory);
