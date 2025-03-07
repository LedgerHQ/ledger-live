import React from "react";
import { SectionList, SectionListData, SectionListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { Account, AccountLike, DailyOperationsSection, Operation } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";

import { Trans } from "react-i18next";

import NoOperationFooter from "~/components/NoOperationFooter";
import NoMoreOperationFooter from "~/components/NoMoreOperationFooter";
import OperationRow from "~/components/OperationRow";
import SectionHeader from "~/components/SectionHeader";
import LoadingFooter from "~/components/LoadingFooter";
import Button from "~/components/Button";
import { TrackScreen } from "~/analytics";
import EmptyStatePortfolio from "~/screens/Portfolio/EmptyStatePortfolio";
import NoOpStatePortfolio from "~/screens/Portfolio/NoOpStatePortfolio";
import { ListProps } from "./types";

function keyExtractor(item: Operation) {
  return item.id;
}

function ListEmptyComponent({ accountsFiltered }: { accountsFiltered: AccountLike[] }) {
  if (accountsFiltered.length === 0) {
    return <EmptyStatePortfolio />;
  }

  if (accountsFiltered.every(isAccountEmpty)) {
    return <NoOpStatePortfolio />;
  }

  return null;
}

export function OperationsList({
  accountsFiltered,
  allAccounts,
  sections,
  completed,
  onEndReached,
  onTransactionButtonPress,
}: ListProps) {
  const renderItem: SectionListRenderItem<Operation, DailyOperationsSection> = ({
    item,
    index,
    section,
  }) => {
    const account = allAccounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type !== "Account"
        ? (allAccounts.find(a => a.id === account.parentId) as Account)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
        account={account}
        multipleAccounts={accountsFiltered.length > 1}
        isLast={section.data.length - 1 === index}
      />
    );
  };

  function renderSectionHeader({
    section,
  }: {
    section: SectionListData<Operation, DailyOperationsSection>;
  }) {
    return <SectionHeader day={section.day} />;
  }

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
        showsVerticalScrollIndicator={false}
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
          ) : accountsFiltered.every(isAccountEmpty) ? null : sections.length ? (
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
