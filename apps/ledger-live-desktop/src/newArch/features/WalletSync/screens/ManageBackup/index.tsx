import React, { forwardRef, useImperativeHandle } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { BackProps, BackRef } from "../router";
import ManageBackupStep from "./01-ManageBackupStep";
import DeleteBackupStep from "./02-DeleteBackupStep";
import BackupDeleted from "./03-FinalStep";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";

const WalletSyncManageBackup = forwardRef<BackRef, BackProps>((_props, ref) => {
  const {
    currentStep,
    goToNextScene,
    goToPreviousScene,
    FlowOptions,
    goToWelcomeScreenWalletSync,
  } = useFlows();

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const goBack = () => {
    if (currentStep === FlowOptions[Flow.ManageBackup].steps[1]) {
      goToWelcomeScreenWalletSync(true);
    } else {
      goToPreviousScene();
    }
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.ManageBackup:
        return <ManageBackupStep goToDeleteBackup={goToNextScene} />;
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
