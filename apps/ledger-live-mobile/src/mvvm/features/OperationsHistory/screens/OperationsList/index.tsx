import React, { useCallback, useMemo } from "react";
import { SectionList, SectionListData, SectionListRenderItem } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Account, DailyOperationsSection, Operation } from "@ledgerhq/types-live";
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
import { BottomFadeGradient } from "./components/BottomFadeGradient";
import { SectionSeparator } from "./components/SectionSeparator";
import { useOperationsListViewModel } from "./useOperationsListViewModel";
import { GRADIENT_HEIGHT } from "LLM/features/OperationsHistory/const";

type Props = StackNavigatorProps<OperationsHistoryNavigatorParamsList, ScreenName.OperationsList>;

function keyExtractor(item: Operation) {
  return `${item.accountId}_${item.id}_${item.type}`;
}

export default function OperationsList(_: Props) {
  const { bottom } = useSafeAreaInsets();
  const {
    accounts,
    flattenedAccounts,
    accountByAddress,
    sections,
    completed,
    isEmpty,
    onEndReached,
  } = useOperationsListViewModel();

  const listContentStyle = useMemo(
    () => ({
      ...contentContainerStyle,
      paddingBottom: isEmpty ? 0 : GRADIENT_HEIGHT + bottom,
    }),
    [isEmpty, bottom],
  );

  const renderItem: SectionListRenderItem<Operation, DailyOperationsSection> = useCallback(
    ({ item }) => {
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
        />
      );
    },
    [flattenedAccounts, accounts, accountByAddress],
  );

  const renderSectionHeader = useCallback(
    (info: { section: SectionListData<Operation, DailyOperationsSection> }) => (
      <OperationsSectionHeader day={info.section.day} />
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
      <TrackScreen name="OperationsList" />
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
const contentContainerStyle = { flexGrow: 1, paddingHorizontal: 16 } as const;
