import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "LLD/WalletSync/Flows/useFlows";
import { BackProps, BackRef } from "../router";
import ManageInstancesStep from "./01-ManageInstancesStep";
import DeviceActionInstanceStep from "./02-DeviceActionInstanceStep";
import DeleteInstanceWithTrustchain from "./03-DeleteInstanceWithTrustchain";
import DeletionFinalStep from "./04-DeletionFinalStep";
import DeletionErrorFinalStep from "./04-DeletionFinalErrorStep";
import { UnsecuredError } from "../Activation/03-UnsecuredError";
import { TrustchainMember } from "@ledgerhq/trustchain/types";

const WalletSyncManageInstances = forwardRef<BackRef, BackProps>((_props, ref) => {
  const [selectedInstance, setSelectedInstance] = useState<TrustchainMember | null>(null);
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
    if (currentStep === FlowOptions[Flow.ManageInstances].steps[1]) {
      goToWelcomeScreenWalletSync(true);
    } else {
      goToPreviousScene();
    }
  };

  const goToDeleteInstance = (instance: TrustchainMember) => {
    setSelectedInstance(instance);
    goToNextScene();
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.SynchronizedInstances:
        return <ManageInstancesStep goToDeleteInstance={goToDeleteInstance} />;
      case Step.DeviceActionInstance:
        return <DeviceActionInstanceStep goNext={goToNextScene} />;
      case Step.DeleteInstanceWithTrustChain:
        return <DeleteInstanceWithTrustchain instance={selectedInstance} />;
      case Step.InstanceSuccesfullyDeleted:
        return <DeletionFinalStep instance={selectedInstance} />;
      case Step.InstanceErrorDeletion:
        return <DeletionErrorFinalStep instance={selectedInstance} />;
      case Step.UnsecuredLedger:
        return <UnsecuredError />;
    }
  };

  return (
    <Flex flexDirection="column" height="100%" rowGap="48px">
      {getStep()}
    </Flex>
  );
});

WalletSyncManageInstances.displayName = "WalletSyncManageInstances";
export default WalletSyncManageInstances;
