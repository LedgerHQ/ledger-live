import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AddressListItemView } from "./AddressListItemView";
import { useAddressListItemViewModel } from "../hooks/useAddressListItemViewModel";

type AddressListItemProps = Readonly<{
  account: AccountLike;
  lookupParentAccount: (id: string) => Account | undefined | null;
  onNavigate: (account: AccountLike, parentAccount?: Account | null) => void;
}>;

export function AddressListItem({
  account,
  lookupParentAccount,
  onNavigate,
}: AddressListItemProps) {
  const vm = useAddressListItemViewModel(account, lookupParentAccount, onNavigate);
  return <AddressListItemView vm={vm} />;
}
