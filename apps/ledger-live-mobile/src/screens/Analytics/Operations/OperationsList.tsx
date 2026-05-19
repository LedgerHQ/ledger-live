import React, { useCallback } from "react";
import { SectionList, SectionListData, SectionListRenderItem } from "react-native";
import uniqBy from "lodash/uniqBy";
import { Flex } from "@ledgerhq/native-ui";
import { Account, AccountLike, DailyOperationsSection, Operation } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/live-common/account/helpers";
import { useAccountBridgeMany } from "@ledgerhq/live-common/bridge/useAccountBridge";

import { Trans } from "~/context/Locale";

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

function ListEmptyBody({
  accountsFiltered,
  isAllEmpty,
}: Readonly<{
  accountsFiltered: AccountLike[];
  isAllEmpty: boolean;
}>) {
  if (accountsFiltered.length === 0) return <EmptyStatePortfolio />;
  if (isAllEmpty) return <NoOpStatePortfolio />;
  return null;
}

function renderFooter({
  completed,
  hasOnEndReached,
  isAllEmpty,
  hasSections,
  onTransactionButtonPress,
}: {
  completed: boolean;
  hasOnEndReached: boolean;
  isAllEmpty: boolean;
  hasSections: boolean;
  onTransactionButtonPress?: () => void;
}) {
  if (!completed) {
    return hasOnEndReached ? (
      <LoadingFooter />
    ) : (
      <Flex m={8}>
        <Button
          event="View Transactions"
          type="lightPrimary"
          title={<Trans i18nKey="common.seeAll" />}
          onPress={onTransactionButtonPress}
        />
      </Flex>
    );
  }
  if (isAllEmpty) return null;
  return hasSections ? <NoMoreOperationFooter /> : <NoOperationFooter />;
}

export function OperationsList({
  accountsFiltered,
  allAccounts,
  sections,
  completed,
  onEndReached,
  onTransactionButtonPress,
}: ListProps) {
  const allAccountsById = new Map(allAccounts.map(a => [a.id, a]));
  const parentAccountsNeeded = uniqBy(
    accountsFiltered
      .map(a => (a.type === "Account" ? a : allAccountsById.get(a.parentId)))
      .filter((a): a is Account => Boolean(a)),
    a => a.id,
  );
  const bridges = useAccountBridgeMany(parentAccountsNeeded);
  const bridgeById = new Map(parentAccountsNeeded.map((a, i) => [a.id, bridges[i]]));
  const isAllEmpty =
    accountsFiltered.length > 0 &&
    accountsFiltered.every(a =>
      Boolean(bridgeById.get(a.type === "Account" ? a.id : a.parentId)?.isAccountEmpty(a)),
    );
  const ListEmptyComponent = useCallback(
    () => <ListEmptyBody accountsFiltered={accountsFiltered} isAllEmpty={isAllEmpty} />,
    [accountsFiltered, isAllEmpty],
  );
  const renderItem: SectionListRenderItem<Operation, DailyOperationsSection> = ({
    item,
    index,
    section,
  }) => {
    const flattenedAccounts = flattenAccounts(accountsFiltered);
    const account = flattenedAccounts.find(a => a.id === item.accountId);
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
        multipleAccounts={flattenedAccounts.length > 1}
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
        testID="operations-list-section-list"
        sections={sections}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFooter({
          completed,
          hasOnEndReached: !!onEndReached,
          isAllEmpty,
          hasSections: sections.length > 0,
          onTransactionButtonPress,
        })}
        ListEmptyComponent={ListEmptyComponent}
      />
      <TrackScreen category="Analytics" name="Operations" />
    </Flex>
  );
}
