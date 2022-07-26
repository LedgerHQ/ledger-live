/* eslint-disable import/named */
import React, { memo, useState, useCallback } from "react";
import { SectionList } from "react-native";
import { Flex } from "@ledgerhq/native-ui";

import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
// @ts-ignore
import { SectionBase } from "react-native/Libraries/Lists/SectionList";
import { AccountLikeArray, Operation } from "@ledgerhq/live-common/types/index";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/groupOperations";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";

import { Trans } from "react-i18next";
import { useRefreshAccountsOrdering } from "../../actions/general";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";

import NoOperationFooter from "../../components/NoOperationFooter";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";

import EmptyStatePortfolio from "../Portfolio/EmptyStatePortfolio";
import NoOpStatePortfolio from "../Portfolio/NoOpStatePortfolio";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import LoadingFooter from "../../components/LoadingFooter";
import Button from "../../components/Button";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

type Props = {
  navigation: any;
};

export function Operations({ navigation }: Props) {
  const [opCount, setOpCount] = useState(50);

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  const accounts = useSelector(accountsSelector);
  const allAccounts: AccountLikeArray = useSelector(flattenAccountsSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
  });

  function ListEmptyComponent() {
    if (accounts.length === 0) {
      return <EmptyStatePortfolio />;
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
    item: Operation;
    index: number;
    section: SectionBase<any>;
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
    <Flex flex={1} px={4}>
      <SectionList
        sections={sections}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        onEndReached={onEndReached}
        ListFooterComponent={
          !completed ? (
            !onEndReached ? (
              <Flex m={8}>
                <Button
                  event="View Transactions"
                  type="lightPrimary"
                  title={<Trans i18nKey="common.seeAll" />}
                  onPress={onTransactionButtonPress}
                />
              </Flex>
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
      <TrackScreen category="Analytics" name="Operations" />
    </Flex>
  );
}

export default withDiscreetMode(memo<Props>(Operations));
