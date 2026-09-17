import React, { useCallback, useMemo } from "react";
import { SectionList, type SectionListRenderItem } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { Account, Operation } from "@ledgerhq/types-live";
import { CardArtwork } from "@features/flow-pay-card-details";
import { CardTransactionHistory } from "@features/flow-pay-card-transactions";
import { TrackScreen } from "~/analytics";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import { HISTORY_TAB_CARD } from "LLM/features/OperationsHistory/constants";
import { HistoryTypeSwitcher } from "./components/HistoryTypeSwitcher";
import { OperationsEmptyState } from "./components/OperationsEmptyState";
import { OperationsHistoryOptionsSheet } from "./components/OperationsHistoryOptionsSheet";
import OperationsListItem from "./components/OperationsListItem";
import { OperationsListFooter } from "./components/OperationsListFooter";
import OperationsSectionHeader from "./components/OperationsSectionHeader";
import { SectionSeparator } from "./components/SectionSeparator";
import type { CardHistoryViewModel } from "./components/useCardHistoryViewModel";
import type { OperationsListSection, OperationsListViewModel } from "./useOperationsListViewModel";

type OperationsListViewProps = Readonly<{
  viewModel: OperationsListViewModel;
  cardHistoryViewModel: CardHistoryViewModel;
  bottomInset: number;
}>;

function keyExtractor(item: Operation) {
  return `${item.accountId}_${item.id}_${item.type}`;
}

export function OperationsListView({
  viewModel,
  cardHistoryViewModel,
  bottomInset,
}: OperationsListViewProps) {
  const {
    accounts,
    flattenedAccounts,
    accountByAddress,
    lastSeenTs,
    sections,
    completed,
    isEmpty,
    hasPendingOperations,
    onEndReached,
    isOptionsSheetOpen,
    closeOptionsSheet,
    isDustFilterFeatureEnabled,
    dustFilterOption,
    onToggleHideSmallValueTokenOperations,
    showHistoryTypeSwitcher,
    historyTab,
    onHistoryTabChange,
  } = viewModel;
  const isCardTab = showHistoryTypeSwitcher && historyTab === HISTORY_TAB_CARD;

  const listContentStyle = useMemo(
    () => ({
      ...contentContainerStyle,
      paddingBottom: isEmpty ? 0 : GRADIENT_HEIGHT + bottomInset,
    }),
    [bottomInset, isEmpty],
  );

  const renderItem: SectionListRenderItem<Operation, OperationsListSection> = useCallback(
    ({ item, section }) => {
      const account = flattenedAccounts.find(candidate => candidate.id === item.accountId);
      const parentAccount: Account | undefined =
        account && account.type !== "Account"
          ? accounts.find(candidate => candidate.id === account.parentId)
          : undefined;

      if (!account) return null;

      return (
        <OperationsListItem
          operation={item}
          account={account}
          parentAccount={parentAccount}
          accountByAddress={accountByAddress}
          isPending={section.isPending ?? false}
          lastSeenTs={lastSeenTs}
        />
      );
    },
    [accountByAddress, accounts, flattenedAccounts, lastSeenTs],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: OperationsListSection }) => (
      <OperationsSectionHeader day={section.day} isPending={section.isPending} />
    ),
    [],
  );

  const ListFooterComponent = useMemo(
    () => <OperationsListFooter completed={completed} />,
    [completed],
  );

  const ListEmptyComponent = useCallback(
    () => (isEmpty ? <OperationsEmptyState /> : null),
    [isEmpty],
  );

  return (
    <Box lx={rootStyle}>
      <TrackScreen name="OperationsList" has_pending_operations={hasPendingOperations} />
      {showHistoryTypeSwitcher ? (
        <HistoryTypeSwitcher selectedTab={historyTab} onTabChange={onHistoryTabChange} />
      ) : null}
      {isCardTab ? (
        <CardTransactionHistory
          formatters={cardHistoryViewModel.formatters}
          formatDay={cardHistoryViewModel.formatDay}
          onTrackEvent={cardHistoryViewModel.onTrackEvent}
          onGoToPay={cardHistoryViewModel.onGoToPay}
          cardVisual={<CardArtwork />}
        />
      ) : (
        <SectionList
          sections={sections}
          testID="operations-list-section-list"
          style={listStyle}
          contentContainerStyle={listContentStyle}
          overScrollMode="never"
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          SectionSeparatorComponent={SectionSeparator}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          scrollEnabled={!isEmpty}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
        />
      )}
      {!isCardTab && !isEmpty ? <BottomFadeGradient /> : null}
      {!isCardTab && isDustFilterFeatureEnabled ? (
        <OperationsHistoryOptionsSheet
          isOpen={isOptionsSheetOpen}
          dustFilterOption={dustFilterOption}
          onClose={closeOptionsSheet}
          onToggle={onToggleHideSmallValueTokenOperations}
        />
      ) : null}
    </Box>
  );
}

const rootStyle: LumenViewStyle = {
  flex: 1,
};

const listStyle = { flex: 1 } as const;
const contentContainerStyle = { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8 } as const;
