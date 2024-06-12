import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { useFlows } from "../useFlows";
import CreateOrSynchronizeStep from "./01-CreateOrSynchronizeStep";
import DeviceActionStep from "./02-DeviceActionStep";
import ActivationOrSynchroWithTrustchain from "./03-ActivationOrSynchroWithTrustchain";
import ActivationFinalStep from "./04-ActivationFinalStep";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const WalletSyncActivation = () => {
  const dispatch = useDispatch();
  const [device, setDevice] = useState<Device | null>(null);

  const { currentStep, goToNextScene } = useFlows({ flow: Flow.Activation });

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));
  };

  const goToActivationOrSynchroWithTrustchain = (device: Device) => {
    console.log("DEVICE", device);
    setDevice(device);
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronizeTrustChain }));
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.CreateOrSynchronize:
        return <CreateOrSynchronizeStep goToCreateBackup={goToNextScene} goToSync={goToSync} />;
      case Step.DeviceAction:
        return <DeviceActionStep goNext={goToActivationOrSynchroWithTrustchain} />;
      case Step.CreateOrSynchronizeTrustChain:
        return <ActivationOrSynchroWithTrustchain device={device} />;
      case Step.ActivationFinal:
        return <ActivationFinalStep isNewBackup={true} />;
      case Step.SynchronizationFinal:
        return <ActivationFinalStep isNewBackup={false} />;
    }
  };

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX="64px"
      alignSelf="center"
      justifyContent="center"
      rowGap="48px"
    >
      {getStep()}
    </Flex>
  );
};

export default WalletSyncActivation;
