import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "LLD/WalletSync/Flows/useFlows";
import { BackProps, BackRef } from "../router";
import ManageBackupStep from "./01-ManageBackupStep";
import DeleteBackupStep from "./02-DeleteBackupStep";
import BackupDeleted from "./03-FinalStep";
import { useBackup } from "./useBackup";

const WalletSyncManageBackups = forwardRef<BackRef, BackProps>((_props, ref) => {
  const { currentStep, goToNextScene, goToPreviousScene, FlowOptions, resetFlows } = useFlows({
    flow: Flow.ManageBackups,
  });

  const { deleteBackup } = useBackup();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const goBack = () => {
    if (currentStep === FlowOptions[Flow.ManageBackups].steps[1]) {
      resetFlows();
    } else {
      goToPreviousScene();
    }
  };

  const goToDeleteData = () => {
    goToNextScene();
  };

  const deleteBackupAction = () => {
    goToNextScene();
    deleteBackup();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccessful(true);
    }, 500);
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.ManageBackupStep:
        return <ManageBackupStep goToDeleteBackup={goToDeleteData} />;
      case Step.DeleteBackupStep:
        return <DeleteBackupStep cancel={goBack} deleteBackup={deleteBackupAction} />;
      case Step.BackupDeleted:
        return <BackupDeleted isLoading={isLoading} isSuccessful={isSuccessful} />;
    }
  };

  return (
    <Flex flexDirection="column" height="100%" paddingX="40px" rowGap="48px">
      {getStep()}
    </Flex>
  );
});

WalletSyncManageBackups.displayName = "WalletSyncManageBackups";
export default WalletSyncManageBackups;
