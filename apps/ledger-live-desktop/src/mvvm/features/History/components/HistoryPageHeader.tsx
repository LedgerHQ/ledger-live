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
  /** Name of the card asset the history is scoped to, e.g. "USD Coin". */
  assetName?: string;
}>;

export default function HistoryPageHeader({
  onBack,
  onExportClick,
  showDustFilterOption,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
  contact,
  assetName,
}: Props) {
  const { t } = useTranslation();
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);
  // Sits next to the title like the contact scope, but reads as part of it: same size, muted.
  const assetScope = assetName ? (
    <span className="heading-4-semi-bold">{`${t("history.tabs.card")} - ${assetName}`}</span>
  ) : undefined;

  return (
    <>
      <HistoryExportDialog open={isExportDialogOpen} onOpenChange={setExportDialogOpen} />
      <PageHeader
        title={t("history.title")}
        extra={assetScope ?? (contact ? <HistoryContactScope contact={contact} /> : undefined)}
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
