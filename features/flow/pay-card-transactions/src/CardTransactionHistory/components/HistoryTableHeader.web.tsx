import React from "react";
import { TableHeader, TableHeaderCell, TableHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";

import type { CardTransactionHistoryColumnSet } from "../types";

export function HistoryTableHeader({
  columnSet = "card",
}: Readonly<{ columnSet?: CardTransactionHistoryColumnSet }>) {
  const { t } = useTranslation();
  const isAsset = columnSet === "asset";

  return (
    <TableHeader>
      <TableHeaderRow stickyHeader={false} className="z-10">
        <TableHeaderCell data-testid="card-history-column-transaction">
          {t("payTab.cardTransactions.history.columns.transaction")}
        </TableHeaderCell>
        {isAsset ? (
          <TableHeaderCell align="end" data-testid="card-history-column-value">
            {t("payTab.card.assets.history.columns.value")}
          </TableHeaderCell>
        ) : (
          <TableHeaderCell align="end" data-testid="card-history-column-funding">
            {t("payTab.cardTransactions.history.columns.fundingSources")}
          </TableHeaderCell>
        )}
        <TableHeaderCell align="end" data-testid="card-history-column-amount">
          {t(
            isAsset
              ? "payTab.card.assets.history.columns.amount"
              : "payTab.cardTransactions.history.columns.amount",
          )}
        </TableHeaderCell>
      </TableHeaderRow>
    </TableHeader>
  );
}
