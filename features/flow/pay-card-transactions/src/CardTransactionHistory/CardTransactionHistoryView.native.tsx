import React, { useCallback, useMemo } from "react";
import { SectionList, type SectionListRenderItem } from "react-native";
import { Box, Skeleton, Spot } from "@ledgerhq/lumen-ui-rnative";
import { CreditCard } from "@ledgerhq/lumen-ui-rnative/symbols";
import { StatusMessage, type StatusMessageProps } from "./components/StatusMessage";
import { DayHeader } from "./components/DayHeader";
import { HistoryRow } from "./components/HistoryRow";
import { SectionSeparator } from "./components/SectionSeparator";
import type { CardTransactionItem } from "../types";
import type { HistorySection } from "./components/types";
import type { CardTransactionHistoryViewProps } from "./types";

function createPayCta(
  testId: string,
  onGoToPay?: () => void,
): StatusMessageProps["action"] | undefined {
  return onGoToPay
    ? { labelKey: "payTab.cardTransactions.history.goToPay", testId, onClick: onGoToPay }
    : undefined;
}

export function CardTransactionHistoryView({
  displayState,
  formatters,
  formatDay,
  onRowClick,
  onGoToPay,
  cardVisual,
}: CardTransactionHistoryViewProps) {
  const sections: HistorySection[] = useMemo(() => {
    if (displayState.kind !== "ready") return [];
    return displayState.groups.map(group => ({ day: group.day, data: group.items }));
  }, [displayState]);

  const renderItem: SectionListRenderItem<CardTransactionItem, HistorySection> = useCallback(
    ({ item }) => <HistoryRow item={item} formatters={formatters} onRowClick={onRowClick} />,
    [formatters, onRowClick],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: HistorySection }) => (
      <DayHeader day={section.day} formatDay={formatDay} />
    ),
    [formatDay],
  );

  switch (displayState.kind) {
    case "signedOut":
      return (
        <StatusMessage
          spot={
            cardVisual ? (
              <Box lx={{ width: "s320" }}>{cardVisual}</Box>
            ) : (
              <Spot appearance="icon" icon={CreditCard} size={72} />
            )
          }
          titleKey="payTab.cardTransactions.history.signedOut.title"
          descriptionKey="payTab.cardTransactions.history.signedOut.description"
          testId="card-history-signed-out-state"
          action={createPayCta("card-history-signed-out-state-cta", onGoToPay)}
        />
      );
    case "loading":
      return (
        <Box testID="card-history-loading-state">
          <Skeleton component="list-item" />
          <Skeleton component="list-item" />
          <Skeleton component="list-item" />
        </Box>
      );
    case "error":
      return (
        <StatusMessage
          spot={<Spot appearance="info" size={72} />}
          titleKey="payTab.cardTransactions.history.error.title"
          descriptionKey="payTab.cardTransactions.history.error.description"
          testId="card-history-error-state"
        />
      );
    case "empty":
      return (
        <StatusMessage
          spot={<Spot appearance="icon" icon={CreditCard} size={72} />}
          titleKey="payTab.cardTransactions.history.empty.title"
          descriptionKey="payTab.cardTransactions.history.empty.description"
          testId="card-history-empty-state"
          action={createPayCta("card-history-empty-state-cta", onGoToPay)}
        />
      );
    case "ready":
      return (
        <SectionList
          testID="card-history-list"
          sections={sections}
          keyExtractor={item => item.transaction.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          SectionSeparatorComponent={SectionSeparator}
          stickySectionHeadersEnabled={false}
          style={listStyle}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      );
  }
}

const listStyle = { flex: 1 } as const;
const listContentStyle = { paddingHorizontal: 16, paddingTop: 8 } as const;
