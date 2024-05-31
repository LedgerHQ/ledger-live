import React from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { useFlows } from "../useFlows";
import CreateOrSynchronizeStep from "./01-CreateOrSynchronizeStep";
import DeviceActionStep from "./02-DeviceActionStep";
import ActivationFinalStep from "./03-ActivationFinalStep";

const WalletSyncActivation = () => {
  const dispatch = useDispatch();
  const HAS_BACKUP = false;

  const { currentStep, goToNextScene } = useFlows({ flow: Flow.Activation });

  const goToSync = () => {
    dispatch(setFlow(Flow.Synchronize));
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.CreateOrSynchronizeStep:
        return <CreateOrSynchronizeStep goToCreateBackup={goToNextScene} goToSync={goToSync} />;
      case Step.DeviceActionStep:
        return <DeviceActionStep goNext={goToNextScene} />;
      case Step.ActivationFinalStep:
        return <ActivationFinalStep hasBackup={HAS_BACKUP} />;
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
