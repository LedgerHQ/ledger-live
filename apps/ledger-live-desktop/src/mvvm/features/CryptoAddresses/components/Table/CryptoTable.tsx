import React, { Suspense } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCryptoDataTable } from "./hooks/useCryptoDataTable";
import { PlainCryptoTable } from "../PlainCryptoTable";
import { AccountSettings } from "@features/flow-account-detail-settings/web";
import { useAccountSettingsAdapter } from "LLD/hooks/useAccountSettingsAdapter";
import { useManageAssetsAction } from "LLD/hooks/useManageAssetsAction";
import { EditName } from "../EditName";
import { CryptoTableCellDataProvider } from "./CryptoTableCells";
import type { AccountSettingsDialogData } from "./hooks/useAccountSettingsDialog";

type CryptoTableProps = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

function CryptoTableAccountSettings({ account, isOpen, onClose }: AccountSettingsDialogData) {
  const accountSettingsAdapter = useAccountSettingsAdapter();
  const onManageAssets = useManageAssetsAction(account);

  return (
    <AccountSettings
      account={account}
      adapter={accountSettingsAdapter}
      isOpen={isOpen}
      onClose={onClose}
      onManageAssets={onManageAssets}
      testID="crypto-addresses-account-settings-dialog"
    />
  );
}

export function CryptoTable({ rows, lookupParentAccount, onRowClick }: CryptoTableProps) {
  const {
    table,
    handleRowClick,
    getRowTestId,
    cellData,
    editNameDialog,
    settingsDialog,
    isSyncing,
  } = useCryptoDataTable({ rows, lookupParentAccount, onRowClick });

  return (
    <CryptoTableCellDataProvider value={cellData}>
      <PlainCryptoTable table={table} onRowClick={handleRowClick} getRowTestId={getRowTestId} />
      {editNameDialog && (
        <EditName
          key={editNameDialog.session}
          account={editNameDialog.account}
          asset={editNameDialog.asset}
          open={editNameDialog.open}
          onOpenChange={editNameDialog.onOpenChange}
          isSyncing={isSyncing}
        />
      )}
      {settingsDialog && (
        <Suspense fallback={null}>
          <CryptoTableAccountSettings {...settingsDialog} />
        </Suspense>
      )}
    </CryptoTableCellDataProvider>
  );
}
