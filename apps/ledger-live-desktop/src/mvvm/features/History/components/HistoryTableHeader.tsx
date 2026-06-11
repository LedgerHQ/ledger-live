import React from "react";
import { TableHeader, TableHeaderRow, TableHeaderCell } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

function HistoryTableHeader() {
  const { t } = useTranslation();
  return (
    <TableHeader>
      <TableHeaderRow stickyHeader={false} className="z-10">
        <TableHeaderCell data-testid="history-column-type">
          {t("history.columns.type")}
        </TableHeaderCell>
        <TableHeaderCell align="end" data-testid="history-column-address">
          {t("history.columns.address")}
        </TableHeaderCell>
        <TableHeaderCell align="end" data-testid="history-column-amount">
          {t("history.columns.amount")}
        </TableHeaderCell>
        <TableHeaderCell align="end" data-testid="history-column-value">
          {t("history.columns.value")}
        </TableHeaderCell>
      </TableHeaderRow>
    </TableHeader>
  );
}

export { HistoryTableHeader };
