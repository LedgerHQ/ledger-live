import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AddressListItem } from "./AddressListItem";

export type AddressListProps = Readonly<{
  sortedAccounts: AccountLike[];
  lookupParentAccount: (id: string) => Account | undefined | null;
  onAccountClick: (account: AccountLike, parentAccount?: Account | null) => void;
}>;

export function AddressList({
  sortedAccounts,
  lookupParentAccount,
  onAccountClick,
}: AddressListProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="asset-detail-address-list">
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
