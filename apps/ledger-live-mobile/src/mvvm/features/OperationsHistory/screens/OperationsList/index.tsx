import React, { useCallback, useMemo } from "react";
import { SectionList, SectionListRenderItem } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Account, Operation } from "@ledgerhq/types-live";
import type { OperationsListSection } from "./useOperationsListViewModel";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { OperationsHistoryNavigatorParamsList } from "LLM/features/OperationsHistory/types";
import OperationsListItem from "./components/OperationsListItem";
import OperationsSectionHeader from "./components/OperationsSectionHeader";
import { OperationsEmptyState } from "./components/OperationsEmptyState";
import { OperationsListFooter } from "./components/OperationsListFooter";
import { SectionSeparator } from "./components/SectionSeparator";
import { useOperationsListViewModel } from "./useOperationsListViewModel";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";

type Props = StackNavigatorProps<OperationsHistoryNavigatorParamsList, ScreenName.OperationsList>;

function keyExtractor(item: Operation) {
  return `${item.accountId}_${item.id}_${item.type}`;
}

export default function OperationsList({ route }: Props) {
  const { bottom } = useSafeAreaInsets();
  const accountIds = route.params?.accountIds;
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
  } = useOperationsListViewModel(accountIds);

  const listContentStyle = useMemo(
    () => ({
      ...contentContainerStyle,
      paddingBottom: isEmpty ? 0 : GRADIENT_HEIGHT + bottom,
    }),
    [isEmpty, bottom],
  );

  const renderItem: SectionListRenderItem<Operation, OperationsListSection> = useCallback(
    ({ item, section }) => {
      const account = flattenedAccounts.find(a => a.id === item.accountId);
      const parentAccount: Account | undefined =
        account && account.type !== "Account"
          ? accounts.find(a => a.id === account.parentId)
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
    [flattenedAccounts, accounts, accountByAddress, lastSeenTs],
  );

  const renderSectionHeader = useCallback(
    (info: { section: OperationsListSection }) => (
      <OperationsSectionHeader day={info.section.day} isPending={info.section.isPending} />
    ),
    [],
  );

  const ListFooterComponent = useMemo(
    () => <OperationsListFooter completed={completed} />,
    [completed],
  );

  const ListEmptyComponent = useCallback(() => {
    if (!isEmpty) return null;
    return <OperationsEmptyState />;
  }, [isEmpty]);

  return (
    <Box lx={rootStyle}>
      <TrackScreen name="OperationsList" has_pending_operations={hasPendingOperations} />
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
      {!isEmpty && <BottomFadeGradient />}
    </Box>
  );
}

const rootStyle: LumenViewStyle = {
  flex: 1,
};

const listStyle = { flex: 1 } as const;
const contentContainerStyle = { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8 } as const;
