import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import { Flow, walletSyncFlowSelector, walletSyncSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "~/newArch/WalletSync/Flows/Activation";
import WalletSyncManage from "~/newArch/WalletSync/Flows/Manage";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import Synch from "./Synch";
import WalletSyncManageBackups from "./ManageBackup";

export interface BackRef {
  goBack: () => void;
}

export interface BackProps {}

export const WalletSyncRouter = forwardRef<BackRef, BackProps>((_props, ref) => {
  const walletSync = useSelector(walletSyncSelector);
  const walletSyncFlow = useSelector(walletSyncFlowSelector);

  switch (walletSyncFlow) {
    case Flow.Activation:
      if (walletSync.activated) {
        return <WalletSyncManage />;
      } else {
        return <WalletSyncActivation />;
      }
    case Flow.Synchronize:
      return <Synch />;
    case Flow.ManageBackups:
      return <WalletSyncManageBackups ref={ref} />;
    default:
      return (
        <Flex flex={1} alignItems="center" justifyContent="center">
          <InfiniteLoader size={50} />
        </Flex>
      );
  }
});

WalletSyncRouter.displayName = "WalletSyncRouter";
