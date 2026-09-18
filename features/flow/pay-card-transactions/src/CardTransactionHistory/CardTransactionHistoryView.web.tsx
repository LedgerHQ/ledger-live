import React from "react";
import { Skeleton, Spot, Table, TableRoot } from "@ledgerhq/lumen-ui-react";
import { CreditCard } from "@ledgerhq/lumen-ui-react/symbols";
import { HistoryTableBody } from "./components/HistoryTableBody";
import { HistoryTableHeader } from "./components/HistoryTableHeader";
import { StatusMessage, type StatusMessageProps } from "./components/StatusMessage";
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
  columnSet,
  assetCode,
  formatDay,
  onRowClick,
  onGoToPay,
  cardVisual,
}: CardTransactionHistoryViewProps) {
  switch (displayState.kind) {
    case "signedOut":
      return (
        <StatusMessage
          spot={
            cardVisual ? (
              <div className="w-[320px]">{cardVisual}</div>
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
        <div className="flex min-h-0 flex-1 flex-col" data-testid="card-history-loading-state">
          <Skeleton component="table" />
        </div>
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
        <TableRoot
          appearance="plain"
          className="mb-32 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg"
          data-testid="card-history-table"
        >
          <div className="shrink-0 overflow-x-auto overflow-y-hidden">
            <Table>
              <HistoryTableHeader columnSet={columnSet} />
            </Table>
          </div>
          <div className="min-h-0 scrollbar-custom flex-1 overflow-auto scrollbar-gutter-auto">
            <Table data-testid="card-history-table-body">
              <HistoryTableBody
                groups={displayState.groups}
                formatters={formatters}
                columnSet={columnSet}
                assetCode={assetCode}
                formatDay={formatDay}
                onRowClick={onRowClick}
              />
            </Table>
          </div>
        </TableRoot>
      );
  }
}
