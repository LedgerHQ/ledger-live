import React from "react";
import { useSelector } from "react-redux";
import { Flow, walletSyncFlowSelector, walletSyncSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "~/renderer/screens/settings/sections/General/WalletSync/SideContent/Activation";
import WalletSyncManage from "~/renderer/screens/settings/sections/General/WalletSync/SideContent/Manage";
import { Synch } from "./Synch";

export const WalletSyncRouter = () => {
  const walletSync = useSelector(walletSyncSelector);
  const walletSyncFlow = useSelector(walletSyncFlowSelector);

  switch (walletSyncFlow) {
    case Flow.Activation:
      if (walletSync.activated) {
        return <WalletSyncManage />;
      } else {
        return <WalletSyncActivation />;
      }
    case Flow.Sync:
      return <Synch />;
    default:
      return null;
  }
};
