import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import { Flow, walletSyncFlowSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "LLD/WalletSync/Flows/Activation";
import WalletSyncManage from "LLD/WalletSync/Flows/Manage";
import WalletSyncManageBackup from "./ManageBackup";
import SynchronizeWallet from "./Synchronize";
import WalletSyncManageInstances from "./ManageInstances";

export interface BackRef {
  goBack: () => void;
}

export interface BackProps {}

export const WalletSyncRouter = forwardRef<BackRef, BackProps>((_props, ref) => {
  const walletSyncFlow = useSelector(walletSyncFlowSelector);

  switch (walletSyncFlow) {
    default:
    case Flow.Activation:
      return <WalletSyncActivation />;
    case Flow.WalletSyncActivated:
      return <WalletSyncManage />;
    case Flow.Synchronize:
      return <SynchronizeWallet />;
    case Flow.ManageBackup:
      return <WalletSyncManageBackup ref={ref} />;
    case Flow.ManageInstances:
      return <WalletSyncManageInstances ref={ref} />;
  }
});

WalletSyncRouter.displayName = "WalletSyncRouter";
