import React from "react";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { TrackPage } from "@shared/analytics-react";
import { AccountDetailView } from "./AccountDetailView";
import { useAccountDetailViewModel } from "./hooks/useAccountDetailViewModel";

const AccountDetail = () => {
  const viewModel = useAccountDetailViewModel();

  if (viewModel.mode === "redirecting") return null;

  const { account } = viewModel;

  return (
    <>
      <TrackPage
        category="Account"
        currency={account.currency.id}
        operationsLength={account.operations.length}
      />
      <SyncOneAccountOnMount reason="view-account" priority={10} accountId={account.id} />
      <AccountDetailView key={account.id} account={account} />
    </>
  );
};

export default AccountDetail;
