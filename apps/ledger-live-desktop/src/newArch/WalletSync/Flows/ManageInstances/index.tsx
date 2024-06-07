import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "LLD/WalletSync/Flows/useFlows";
import { BackProps, BackRef } from "../router";
import { useBackup } from "./useBackup";
import ManageInstancesStep from "./01-ManageInstancesStep";

const WalletSyncManageInstances = forwardRef<BackRef, BackProps>((_props, ref) => {
  const { currentStep, goToNextScene, goToPreviousScene, FlowOptions, resetFlows } = useFlows({
    flow: Flow.ManageInstances,
  });

  const { deleteBackup } = useBackup();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const goBack = () => {
    if (currentStep === FlowOptions[Flow.ManageInstances].steps[1]) {
      resetFlows();
    } else {
      goToPreviousScene();
    }
  };

  const goToDeleteInstance = () => {
    goToNextScene();
  };

  // const deleteBackupAction = () => {
  //   goToNextScene();
  //   deleteBackup();
  //   setIsLoading(true);
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     setIsSuccessful(true);
  //   }, 500);
  // };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.SynchronizedInstances:
        return <ManageInstancesStep goToDeleteInstance={goToDeleteInstance} />;
    }
  };

  return (
    <Flex flexDirection="column" height="100%" paddingX="40px" rowGap="48px">
      {getStep()}
    </Flex>
  );
});

WalletSyncManageInstances.displayName = "WalletSyncManageInstances";
export default WalletSyncManageInstances;
