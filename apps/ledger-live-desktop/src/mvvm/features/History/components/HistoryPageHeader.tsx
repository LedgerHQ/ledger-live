import React, { useState } from "react";
import PageHeader from "LLD/components/PageHeader";
import { useTranslation } from "react-i18next";
import type { Contact } from "@domain/entity-contact";
import { HistoryExportDialog } from "./HistoryExportDialog";
import { HistoryContactScope } from "./HistoryContactScope";
import { ActionsMenu } from "./HistoryPageHeader/ActionsMenu";

type Props = Readonly<{
  onBack?: () => void;
  onExportClick: () => void;
  showDustFilterOption: boolean;
  hideSmallValueTokenOperations: boolean;
  dustFilterThreshold: string;
  onToggleHideSmallValueTokenOperations: () => void;
  contact?: Contact;
}>;

export default function HistoryPageHeader({
  onBack,
  onExportClick,
  showDustFilterOption,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
  contact,
}: Props) {
  const { t } = useTranslation();
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <>
      <HistoryExportDialog open={isExportDialogOpen} onOpenChange={setExportDialogOpen} />
      <PageHeader
        title={t("history.title")}
        extra={contact ? <HistoryContactScope contact={contact} /> : undefined}
        onBack={onBack}
        trailing={
          <ActionsMenu
            onExportClick={onExportClick}
            onOpenExportDialog={() => setExportDialogOpen(true)}
            showDustFilterOption={showDustFilterOption}
            hideSmallValueTokenOperations={hideSmallValueTokenOperations}
            dustFilterThreshold={dustFilterThreshold}
            onToggleHideSmallValueTokenOperations={onToggleHideSmallValueTokenOperations}
          />
        }
      />
    </>
  );
}
