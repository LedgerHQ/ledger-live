import React from "react";
import { TableHeader, TableHeaderCell, TableHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";

export function HistoryTableHeader() {
  const { t } = useTranslation();

  return (
    <TableHeader>
      <TableHeaderRow stickyHeader={false} className="z-10">
        <TableHeaderCell data-testid="card-history-column-transaction">
          {t("payTab.cardTransactions.history.columns.transaction")}
        </TableHeaderCell>
        <TableHeaderCell align="end" data-testid="card-history-column-funding">
          {t("payTab.cardTransactions.history.columns.fundingSources")}
        </TableHeaderCell>
        <TableHeaderCell align="end" data-testid="card-history-column-amount">
          {t("payTab.cardTransactions.history.columns.amount")}
        </TableHeaderCell>
      </TableHeaderRow>
    </TableHeader>
  );
}
