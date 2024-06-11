import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "../useFlows";
import SynchronizeModeStep from "./01-SyncModeStep";
import SynchWithQRCodeStep from "./02-QRCodeStep";
import PinCodeStep from "./03-PinCodeStep";
import SyncFinalStep from "./04-SyncFinalStep";

const SynchronizeWallet = () => {
  const dispatch = useDispatch();

  const { currentStep, goToNextScene } = useFlows({
    flow: Flow.Synchronize,
  });

  const goToActivation = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.SynchronizeMode:
        return (
          <SynchronizeModeStep goToQRCode={goToNextScene} goToSyncWithDevice={goToActivation} />
        );
      case Step.SynchronizeWithQRCode:
        return <SynchWithQRCodeStep displayPinCode={goToNextScene} />;
      case Step.PinCode:
        return <PinCodeStep />;
      case Step.Synchronized:
        return <SyncFinalStep />;
    }
  };

  return (
    <Flex flexDirection="column" height="100%" paddingX="40px" rowGap="48px">
      {getStep()}
    </Flex>
  );
};

export default SynchronizeWallet;
