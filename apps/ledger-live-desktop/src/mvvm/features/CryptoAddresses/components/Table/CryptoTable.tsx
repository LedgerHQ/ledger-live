import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCryptoDataTable } from "./hooks/useCryptoDataTable";
import { PlainCryptoTable } from "../PlainCryptoTable";
import { EditName } from "../EditName";
import { CryptoTableCellDataProvider } from "./CryptoTableCells";

type CryptoTableProps = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function CryptoTable({ rows, lookupParentAccount, onRowClick }: CryptoTableProps) {
  const { table, handleRowClick, getRowTestId, cellData, editNameDialog, isSyncing } =
    useCryptoDataTable({ rows, lookupParentAccount, onRowClick });

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
    </CryptoTableCellDataProvider>
  );
}
