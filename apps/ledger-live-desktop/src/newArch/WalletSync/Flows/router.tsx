import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import {
  Flow,
  Step,
  walletSyncFlowSelector,
  walletSyncSelector,
} from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "LLD/WalletSync/Flows/Activation";
import WalletSyncManage from "LLD/WalletSync/Flows/Manage";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import WalletSyncManageBackups from "./ManageBackup";
import SynchronizeWallet from "./Synchronize";
import WalletSyncManageInstances from "./ManageInstances";

export interface BackRef {
  goBack: () => void;
}

export interface BackProps {}

export const WalletSyncRouter = forwardRef<BackRef, BackProps>((_props, ref) => {
  const walletSync = useSelector(walletSyncSelector);
  const walletSyncFlow = useSelector(walletSyncFlowSelector);

  switch (walletSyncFlow) {
    case Flow.Activation:
      if (
        walletSync.activated &&
        ![Step.ActivationFinal, Step.BackupDeleted].includes(walletSync.step)
      ) {
        return <WalletSyncManage />;
      } else {
        return <WalletSyncActivation />;
      }
    case Flow.Synchronize:
      return <SynchronizeWallet />;
    case Flow.ManageBackups:
      return <WalletSyncManageBackups ref={ref} />;
    case Flow.ManageInstances:
      return <WalletSyncManageInstances ref={ref} />;
    default:
      return (
        <Flex flex={1} alignItems="center" justifyContent="center">
          <InfiniteLoader size={50} />
        </Flex>
      );
  }
});

WalletSyncRouter.displayName = "WalletSyncRouter";
