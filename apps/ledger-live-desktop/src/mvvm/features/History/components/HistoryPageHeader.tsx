import React from "react";
import PageHeader from "LLD/components/PageHeader";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Csv } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { HistoryExportDialog } from "./HistoryExportDialog";

type Props = Readonly<{
  onBack?: () => void;
  onExportClick: () => void;
}>;

export default function HistoryPageHeader({ onBack, onExportClick }: Props) {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={t("history.title")}
      onBack={onBack}
      trailing={
        <HistoryExportDialog>
          <Button
            appearance="transparent"
            size="sm"
            icon={Csv}
            onClick={onExportClick}
            data-testid="history-export-csv-button"
          >
            {t("history.actionsBar.csv")}
          </Button>
        </HistoryExportDialog>
      }
    />
  );
}
