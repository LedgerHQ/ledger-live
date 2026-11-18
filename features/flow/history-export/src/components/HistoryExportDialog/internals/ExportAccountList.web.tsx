import React from "react";
import type { AccountId } from "@domain/entity-account";
import type { HistoryExportAccount } from "../../../model/ports";
import { ExportAccountsHeader } from "./ExportAccountsHeader";
import { ExportAccountListItem } from "./ExportAccountListItem";

type ExportAccountListProps = Readonly<{
  accounts: readonly HistoryExportAccount[];
  checkedIds: AccountId[];
  allSelected: boolean;
  toggleAccount: (id: AccountId) => void;
  onSelectAllToggle: () => void;
}>;

export function ExportAccountList({
  accounts,
  checkedIds,
  allSelected,
  toggleAccount,
  onSelectAllToggle,
}: ExportAccountListProps) {
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
