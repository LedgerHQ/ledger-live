import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "../useFlows";
import SynchronizeModeStep from "./01-SynchModeStep";
import SynchWithQRCodeStep from "./02-QRCodeStep";

const SynchronizeWallet = () => {
  const dispatch = useDispatch();

  const { currentStep, goToNextScene, goToPreviousScene, FlowOptions, resetFlows } = useFlows({
    flow: Flow.Synchronize,
  });

  const goToActivation = () => {
    dispatch(setFlow(Flow.Activation));
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.SynchronizeModeStep:
        return (
          <SynchronizeModeStep goToQRCode={goToNextScene} goToSynchWithDevice={goToActivation} />
        );
      case Step.SynchronizeWithQRCodeStep:
        return <SynchWithQRCodeStep />;
    }
  };

  return (
    <Flex flexDirection="column" height="100%" paddingX="40px" rowGap="48px">
      {getStep()}
    </Flex>
  );
};

export default SynchronizeWallet;
