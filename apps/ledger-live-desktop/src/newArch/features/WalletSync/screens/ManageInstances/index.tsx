import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";
import { BackProps, BackRef } from "../router";
import ManageInstancesStep from "./01-ManageInstancesStep";
import DeviceActionInstanceStep from "./02-DeviceActionInstanceStep";
import DeleteInstanceWithTrustchain from "./03-DeleteInstanceWithTrustchain";
import DeletionFinalStep from "./04-DeletionFinalStep";
import { DeletionError, ErrorReason } from "./04-DeletionError";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import DeletionErrorFinalStep from "./04-DeletionFinalErrorStep";

const WalletSyncManageInstances = forwardRef<BackRef, BackProps>((_props, ref) => {
  const [device, setDevice] = useState<Device | null>(null);
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

  const goToDeleteInstanceWithTrustchain = (device: Device) => {
    setDevice(device);
    goToNextScene();
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.SynchronizedInstances:
        return <ManageInstancesStep goToDeleteInstance={goToDeleteInstance} />;
      case Step.DeviceActionInstance:
        return <DeviceActionInstanceStep goNext={goToDeleteInstanceWithTrustchain} />;
      case Step.DeleteInstanceWithTrustChain:
        return <DeleteInstanceWithTrustchain instance={selectedInstance} device={device} />;
      case Step.InstanceSuccesfullyDeleted:
        return <DeletionFinalStep instance={selectedInstance} />;
      case Step.InstanceErrorDeletion:
        return <DeletionErrorFinalStep instance={selectedInstance} />;
      case Step.UnsecuredLedger:
        return <DeletionError error={ErrorReason.UNSECURED} />;
      case Step.AutoRemoveInstance:
        return <DeletionError error={ErrorReason.AUTO_REMOVE} />;
    }
  };

  const isStepImpacted = useMemo(
    () =>
      [Step.DeleteInstanceWithTrustChain, Step.InstanceSuccesfullyDeleted].includes(currentStep),
    [currentStep],
  );

  return (
    <Flex
      flexDirection="column"
      height="100%"
      rowGap="48px"
      paddingX={isStepImpacted ? "64px" : undefined}
      alignItems={isStepImpacted ? "center" : undefined}
      justifyContent={isStepImpacted ? "center" : undefined}
    >
      {getStep()}
    </Flex>
  );
});

WalletSyncManageInstances.displayName = "WalletSyncManageInstances";
export default WalletSyncManageInstances;
