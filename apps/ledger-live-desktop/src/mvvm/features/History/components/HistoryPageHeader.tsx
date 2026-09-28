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
  isCardHistory: boolean;
  cardAssetName?: string;
}>;

export default function HistoryPageHeader({
  onBack,
  onExportClick,
  showDustFilterOption,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
  contact,
  isCardHistory,
  cardAssetName,
}: Props) {
  const { t } = useTranslation();
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);
  const cardScope = isCardHistory ? (
    <span className="body-1 text-muted" data-testid="history-card-scope">
      {cardAssetName
        ? t("history.cardAssetScope", { assetName: cardAssetName })
        : t("history.cardScope")}
    </span>
  ) : undefined;

  return (
    <>
      <HistoryExportDialog open={isExportDialogOpen} onOpenChange={setExportDialogOpen} />
      <PageHeader
        title={t("history.title")}
        extra={cardScope ?? (contact ? <HistoryContactScope contact={contact} /> : undefined)}
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
