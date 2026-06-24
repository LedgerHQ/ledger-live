import React, { useState } from "react";
import PageHeader from "LLD/components/PageHeader";
import { IconButton, Menu, MenuContent, MenuItem, MenuTrigger } from "@ledgerhq/lumen-ui-react";
import { Csv, Eye, EyeCross, MoreVertical } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { HistoryExportDialog } from "./HistoryExportDialog";

type Props = Readonly<{
  onBack?: () => void;
  onExportClick: () => void;
  hideSmallValueTokenOperations: boolean;
  dustFilterThreshold: string;
  onToggleHideSmallValueTokenOperations: () => void;
}>;

export default function HistoryPageHeader({
  onBack,
  onExportClick,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
}: Props) {
  const { t } = useTranslation();
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);
  const dustFilterLabel = hideSmallValueTokenOperations
    ? t("history.actionsBar.showDustTransactions")
    : t("history.actionsBar.hideDustTransactions");
  const DustFilterIcon = hideSmallValueTokenOperations ? Eye : EyeCross;

  return (
    <>
      <HistoryExportDialog open={isExportDialogOpen} onOpenChange={setExportDialogOpen} />
      <PageHeader
        title={t("history.title")}
        onBack={onBack}
        trailing={
          <Menu>
            <MenuTrigger
              render={
                <IconButton
                  appearance="transparent"
                  size="sm"
                  icon={MoreVertical}
                  aria-label={t("history.actionsBar.more")}
                  data-testid="history-actions-menu-button"
                />
              }
            />
            <MenuContent className="min-w-280" side="bottom" align="end">
              <MenuItem
                className="cursor-pointer"
                onClick={() => {
                  onExportClick();
                  setExportDialogOpen(true);
                }}
                data-testid="history-export-csv-button"
              >
                <Csv size={20} />
                {t("history.actionsBar.csv")}
              </MenuItem>
              <MenuItem
                className="cursor-pointer"
                onClick={onToggleHideSmallValueTokenOperations}
                data-testid="history-toggle-dust-filter-button"
              >
                <DustFilterIcon size={20} className="shrink-0" />
                <span className="flex flex-col">
                  <span>{dustFilterLabel}</span>
                  <span className="body-3 text-muted">
                    {t("history.actionsBar.dustTransactionsDescription", {
                      threshold: dustFilterThreshold,
                    })}
                  </span>
                </span>
              </MenuItem>
            </MenuContent>
          </Menu>
        }
      />
    </>
  );
}
