import React, { forwardRef, useImperativeHandle } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { BackProps, BackRef } from "../router";
import DeleteBackupStep from "./01-DeleteBackupStep";
import BackupDeleted from "./02-FinalStep";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";

const WalletSyncManageBackup = forwardRef<BackRef, BackProps>((_props, ref) => {
  const { currentStep, goToPreviousScene, FlowOptions, goToWelcomeScreenWalletSync } = useFlows();

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const goBack = () => {
    if (currentStep === FlowOptions[Flow.ManageBackup].steps[1]) {
      goToWelcomeScreenWalletSync();
    } else {
      goToPreviousScene();
    }
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.DeleteBackup:
        return <DeleteBackupStep cancel={goBack} />;
      case Step.BackupDeleted:
        return <BackupDeleted isSuccessful={true} />;
      case Step.BackupDeletionError:
        return <BackupDeleted isSuccessful={false} />;
    }
  };

  return (
    <Flex flexDirection="column" height="100%" paddingX="40px" rowGap="48px">
      {getStep()}
    </Flex>
  );
});

WalletSyncManageBackup.displayName = "WalletSyncManageBackup";
export default WalletSyncManageBackup;
