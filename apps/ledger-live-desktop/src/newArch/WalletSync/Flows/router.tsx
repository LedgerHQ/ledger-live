import React from "react";
import { useSelector } from "react-redux";
import { Flow, walletSyncFlowSelector, walletSyncSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "~/newArch/WalletSync/Flows/Activation";
import WalletSyncManage from "~/newArch/WalletSync/Flows/Manage";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import Synch from "./Synch";

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
    case Flow.Synchronize:
      return <Synch />;
    default:
      return (
        <Flex flex={1} alignItems="center" justifyContent="center">
          <InfiniteLoader size={50} />
        </Flex>
      );
  }
};
