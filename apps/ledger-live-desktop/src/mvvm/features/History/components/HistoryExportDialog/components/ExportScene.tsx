import React from "react";
import {
  DialogHeader,
  DialogContent,
  DialogFooter,
  Button,
  DialogBody,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import type { ExportAccount } from "../useHistoryExportDialogViewModel";
import { ExportDescription } from "./ExportDescription";
import { ExportAccountList } from "./ExportAccountList";

type ExportSceneProps = Readonly<{
  accounts: ExportAccount[];
  checkedIds: string[];
  allSelected: boolean;
  disabled: boolean;
  isLoading: boolean;
  toggleAccount: (id: string) => void;
  onSelectAllToggle: () => void;
  exportCsv: () => void;
}>;

export function ExportScene({
  accounts,
  checkedIds,
  allSelected,
  disabled,
  isLoading,
  toggleAccount,
  onSelectAllToggle,
  exportCsv,
}: ExportSceneProps) {
  const { t } = useTranslation();

  return (
    <DialogContent>
      <DialogHeader title={t("history.exportDialog.title")} />
      <DialogBody className="flex flex-col gap-24">
        <ExportDescription />
        <ExportAccountList
          accounts={accounts}
          checkedIds={checkedIds}
          allSelected={allSelected}
          toggleAccount={toggleAccount}
          onSelectAllToggle={onSelectAllToggle}
        />
      </DialogBody>

      <DialogFooter className="relative">
        <div className="pointer-events-none absolute top-8 left-0 right-0 h-16 bg-gradient-to-b from-canvas-sheet-transparent to-canvas-sheet" />
        <Button
          disabled={disabled || isLoading}
          loading={isLoading}
          onClick={exportCsv}
          appearance="base"
          size="lg"
          isFull
        >
          {t("history.exportDialog.export")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
