import React from "react";
import { IconButton, Menu, MenuContent, MenuItem, MenuTrigger } from "@ledgerhq/lumen-ui-react";
import { Csv, MoreVertical } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { Dust } from "./Dust";

type Props = Readonly<{
  onExportClick: () => void;
  onOpenExportDialog: () => void;
  showDustFilterOption: boolean;
  hideSmallValueTokenOperations: boolean;
  dustFilterThreshold: string;
  onToggleHideSmallValueTokenOperations: () => void;
}>;

export function ActionsMenu({
  onExportClick,
  onOpenExportDialog,
  showDustFilterOption,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
}: Props) {
  const { t } = useTranslation();

  return (
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
            onOpenExportDialog();
          }}
          data-testid="history-export-csv-button"
        >
          <Csv size={20} />
          {t("history.actionsBar.csv")}
        </MenuItem>
        {showDustFilterOption ? (
          <Dust
            hideSmallValueTokenOperations={hideSmallValueTokenOperations}
            dustFilterThreshold={dustFilterThreshold}
            onToggleHideSmallValueTokenOperations={onToggleHideSmallValueTokenOperations}
          />
        ) : null}
      </MenuContent>
    </Menu>
  );
}
