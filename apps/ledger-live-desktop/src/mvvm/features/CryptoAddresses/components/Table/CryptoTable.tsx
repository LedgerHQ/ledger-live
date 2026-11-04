import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCryptoDataTable } from "./hooks/useCryptoDataTable";
import { PlainCryptoTable } from "../PlainCryptoTable";
import { AccountSettings } from "@features/flow-account-detail-settings/web";
import { useAccountSettingsAdapter } from "LLD/hooks/useAccountSettingsAdapter";
import { EditName } from "../EditName";
import { AccountBalanceQueries } from "../AccountBalanceQueries";
import { CryptoTableCellDataProvider } from "./CryptoTableCells";

type CryptoTableProps = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function CryptoTable({ rows, lookupParentAccount, onRowClick }: CryptoTableProps) {
  const {
    balanceTargets,
    table,
    handleRowClick,
    getRowTestId,
    cellData,
    editNameDialog,
    settingsDialog,
    isSyncing,
  } = useCryptoDataTable({ rows, lookupParentAccount, onRowClick });
  const accountSettingsAdapter = useAccountSettingsAdapter();

  return (
    <CryptoTableCellDataProvider value={cellData}>
      <AccountBalanceQueries targets={balanceTargets} />
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
        <AccountSettings
          account={settingsDialog.account}
          adapter={accountSettingsAdapter}
          isOpen={settingsDialog.isOpen}
          onClose={settingsDialog.onClose}
          testID="crypto-addresses-account-settings-dialog"
        />
      )}
    </CryptoTableCellDataProvider>
  );
}
