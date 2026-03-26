import React from "react";
import PageHeader from "LLD/components/PageHeader";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Csv } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { HistoryExportDialog } from "./HistoryExportDialog";

export default function HistoryPageHeader({ onBack }: { readonly onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={t("history.title")}
      onBack={onBack}
      trailing={
        <HistoryExportDialog>
          <Button appearance="transparent" size="sm" icon={Csv}>
            {t("history.actionsBar.csv")}
          </Button>
        </HistoryExportDialog>
      }
    />
  );
}
