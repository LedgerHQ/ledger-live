import React from "react";
import { AccountDetailView } from "./AccountDetailView";
import { useAccountDetailViewModel } from "./useAccountDetailViewModel";

export default function AccountDetail() {
  const { account } = useAccountDetailViewModel();

  if (!account) return null;

  return <AccountDetailView account={account} />;
}
