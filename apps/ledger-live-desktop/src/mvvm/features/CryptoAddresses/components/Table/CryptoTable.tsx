import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCryptoDataTable } from "./hooks/useCryptoDataTable";
import { PlainCryptoTable } from "../PlainCryptoTable";

type CryptoTableProps = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function CryptoTable({ rows, lookupParentAccount, onRowClick }: CryptoTableProps) {
  const { table, handleRowClick, getRowTestId } = useCryptoDataTable({
    rows,
    lookupParentAccount,
    onRowClick,
  });

  return <PlainCryptoTable table={table} onRowClick={handleRowClick} getRowTestId={getRowTestId} />;
}
