import React from "react";
import {
  DialogHeader,
  DialogContent,
  DialogFooter,
  Button,
  DialogBody,
  Spot,
  Banner,
} from "@ledgerhq/lumen-ui-react";
import { CloudDownload } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import type { ExportAccount } from "../useHistoryExportDialogViewModel";
import { ExportAccountsHeader } from "./ExportAccountsHeader";
import { ExportAccountListItem } from "./ExportAccountListItem";

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

function ExportDescription() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-16">
      <Spot appearance="icon" icon={CloudDownload} />
      <span className="body-2 text-muted">{t("history.exportDialog.description")}</span>
      <Banner appearance="warning" description={t("history.exportDialog.disclaimer")} />
    </div>
  );
}

function ExportAccountList({
  accounts,
  checkedIds,
  allSelected,
  toggleAccount,
  onSelectAllToggle,
}: Readonly<{
  accounts: ExportAccount[];
  checkedIds: string[];
  allSelected: boolean;
  toggleAccount: (id: string) => void;
  onSelectAllToggle: () => void;
}>) {
  return (
    <div className="flex flex-col gap-8">
      <ExportAccountsHeader
        allSelected={allSelected}
        count={accounts.length}
        onToggle={onSelectAllToggle}
      />
      <div>
        {accounts.map(account => (
          <ExportAccountListItem
            key={account.id}
            account={account}
            checked={checkedIds.includes(account.id)}
            onToggle={() => toggleAccount(account.id)}
          />
        ))}
      </div>
    </div>
  );
}

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
          disabled={disabled}
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
