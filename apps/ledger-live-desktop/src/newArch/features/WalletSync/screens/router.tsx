import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import { Flow, walletSyncFlowSelector } from "~/renderer/reducers/walletSync";
import WalletSyncManageBackup from "./ManageBackup";
import SynchronizeWallet from "./Synchronize";
import WalletSyncManageInstances from "./ManageInstances";
import WalletSyncActivation from "./Activation";
import WalletSyncManage from "./Manage";
import { useInitMemberCredentials } from "../hooks/useInitMemberCredentials";
import { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";

export interface BackRef {
  goBack: () => void;
}

export interface Props {
  currentPage: AnalyticsPage;
}

export interface BackProps {}

export const WalletSyncRouter = forwardRef<BackRef, Props>(({ currentPage }, ref) => {
  useInitMemberCredentials();
  const walletSyncFlow = useSelector(walletSyncFlowSelector);

  switch (walletSyncFlow) {
    default:
    case Flow.Activation:
      return <WalletSyncActivation ref={ref} sourcePage={currentPage} />;
    case Flow.LedgerSyncActivated:
      return <WalletSyncManage currentPage={currentPage} />;
    case Flow.Synchronize:
      return <SynchronizeWallet ref={ref} />;
    case Flow.ManageBackup:
      return <WalletSyncManageBackup ref={ref} />;
    case Flow.ManageInstances:
      return <WalletSyncManageInstances ref={ref} />;
  }
});

WalletSyncRouter.displayName = "WalletSyncRouter";
