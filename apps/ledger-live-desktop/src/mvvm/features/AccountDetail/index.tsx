import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { AccountDetailView } from "./AccountDetailView";
import { useAccountDetailViewModel } from "./hooks/useAccountDetailViewModel";
import { useAccountPageTracking } from "./hooks/useAccountPageTracking";

const AccountPageTracking = ({ account }: Readonly<{ account: Account }>) => {
  useAccountPageTracking(account);
  return null;
};

const AccountDetail = () => {
  const viewModel = useAccountDetailViewModel();

  if (viewModel.mode === "redirecting") return null;

  const { account } = viewModel;

  return (
    <>
      <AccountPageTracking account={account} />
      <SyncOneAccountOnMount reason="view-account" priority={10} accountId={account.id} />
      <AccountDetailView key={account.id} account={account} />
    </>
  );
};

export default AccountDetail;
