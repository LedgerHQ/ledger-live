import React, { useState } from "react";
import PageHeader from "LLD/components/PageHeader";
import { useTranslation } from "react-i18next";
import { HistoryExportDialog } from "./HistoryExportDialog";
import { ActionsMenu } from "./HistoryPageHeader/ActionsMenu";

type Props = Readonly<{
  onBack?: () => void;
  onExportClick: () => void;
  showDustFilterOption: boolean;
  hideSmallValueTokenOperations: boolean;
  dustFilterThreshold: string;
  onToggleHideSmallValueTokenOperations: () => void;
}>;

export default function HistoryPageHeader({
  onBack,
  onExportClick,
  showDustFilterOption,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
}: Props) {
  const { t } = useTranslation();
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <>
      <HistoryExportDialog open={isExportDialogOpen} onOpenChange={setExportDialogOpen} />
      <PageHeader
        title={t("history.title")}
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
