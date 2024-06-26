import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import { Flow, walletSyncFlowSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "LLD/WalletSync/Flows/Activation";
import WalletSyncManage from "LLD/WalletSync/Flows/Manage";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import WalletSyncManageBackup from "./ManageBackup";
import SynchronizeWallet from "./Synchronize";
import WalletSyncManageInstances from "./ManageInstances";
import { useLifeCycle } from "../hooks/walletSync.hooks";
import { Error } from "../components/Error";

export interface BackRef {
  goBack: () => void;
}

export interface BackProps {}

export const WalletSyncRouter = forwardRef<BackRef, BackProps>((_props, ref) => {
  const walletSyncFlow = useSelector(walletSyncFlowSelector);

  const { isLoading, error, isError } = useLifeCycle();

  if (isLoading) {
    return (
      <Flex flex={1} alignItems="center" justifyContent="center">
        <InfiniteLoader size={50} />
      </Flex>
    );
  } else if (isError) {
    return <Error title={error?.name} description={error?.message} />;
  } else {
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
  }
});

WalletSyncRouter.displayName = "WalletSyncRouter";
