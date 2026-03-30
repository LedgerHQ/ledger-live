import React from "react";
import { TableHeader, TableHeaderRow, TableHeaderCell } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

function HistoryTableHeader() {
  const { t } = useTranslation();
  return (
    <TableHeader>
      <TableHeaderRow className="z-10">
        <TableHeaderCell>{t("history.columns.type")}</TableHeaderCell>
        <TableHeaderCell align="end">{t("history.columns.address")}</TableHeaderCell>
        <TableHeaderCell align="end">{t("history.columns.amount")}</TableHeaderCell>
        <TableHeaderCell align="end">{t("history.columns.value")}</TableHeaderCell>
      </TableHeaderRow>
    </TableHeader>
  );
}

export { HistoryTableHeader };
