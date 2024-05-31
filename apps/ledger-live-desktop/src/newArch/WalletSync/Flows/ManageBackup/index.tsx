import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow } from "~/renderer/reducers/walletSync";
import { useFlows } from "LLD/WalletSync/Flows/useFlows";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { BackProps, BackRef } from "../router";
import ManageBackupStep from "./01-ManageBackupStep";
import DeleteBackupStep from "./02-DeleteBackupStep";
import BackupDeleted from "./03-FinalStep";

const WalletSyncManageBackups = forwardRef<BackRef, BackProps>((_props, ref) => {
  const dispatch = useDispatch();
  const { currentStep, goToNextScene, goToPreviousScene } = useFlows({ flow: Flow.ManageBackups });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const goBack = () => {
    if (currentStep === 1) {
      dispatch(setFlow(Flow.Activation));
    } else {
      goToPreviousScene();
    }
  };

  const goToDeleteData = () => {
    goToNextScene();
  };

  const deleteBackup = () => {
    console.log("backup deleted");
    goToNextScene();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccessful(true);
    }, 500);
  };

  const getStep = () => {
    switch (currentStep) {
      case 1:
        return <ManageBackupStep goToDeleteBackup={goToDeleteData} />;
      case 2:
        return <DeleteBackupStep cancel={goBack} deleteBackup={deleteBackup} />;
      case 3:
        return <BackupDeleted isLoading={isLoading} isSuccessful={isSuccessful} />;
      default:
        return null;
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
