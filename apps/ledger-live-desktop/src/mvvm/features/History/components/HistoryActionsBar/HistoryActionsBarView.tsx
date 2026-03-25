import React from "react";
import { TableActionBar, TableActionBarTrailing } from "@ledgerhq/lumen-ui-react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Csv } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import type { HistoryActionsBarViewModel } from "./useHistoryActionsBarViewModel";

export function HistoryActionsBarView({ onExportCsv }: Readonly<HistoryActionsBarViewModel>) {
  const { t } = useTranslation();
  return (
    <TableActionBar>
      <TableActionBarTrailing>
        <Button appearance="transparent" size="md" icon={Csv} onClick={onExportCsv}>
          {t("history.actionsBar.csv")}
        </Button>
      </TableActionBarTrailing>
    </TableActionBar>
  );
}
