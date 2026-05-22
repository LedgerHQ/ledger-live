import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AddressListItem } from "./AddressListItem";

export type AddressListProps = Readonly<{
  sortedAccounts: AccountLike[];
  lookupParentAccount: (id: string) => Account | undefined | null;
  onAccountClick: (account: AccountLike, parentAccount?: Account | null) => void;
  testId?: string;
}>;

export function AddressList({
  sortedAccounts,
  lookupParentAccount,
  onAccountClick,
  testId = "asset-detail-address-list",
}: AddressListProps) {
  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      {sortedAccounts.map(account => (
        <AddressListItem
          key={account.id}
          account={account}
          lookupParentAccount={lookupParentAccount}
          onNavigate={onAccountClick}
        />
      ))}
    </div>
  );
}
