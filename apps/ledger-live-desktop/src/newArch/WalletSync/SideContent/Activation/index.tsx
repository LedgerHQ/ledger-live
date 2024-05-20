import React from "react";
import { useFlows } from "../Flows/useFlows";
import { StepOne } from "./stepA";
import { Flow } from "~/renderer/reducers/walletSync";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { StepTwo } from "./stepB";
import { Flex } from "@ledgerhq/react-ui";
import { StepThree } from "./stepC";

const WalletSyncActivation = () => {
  const dispatch = useDispatch();
  const { currentStep, goToNextScene, setCurrentStep } = useFlows({ flow: Flow.Activation });

  const goToSync = () => {
    dispatch(setFlow(Flow.Sync));
  };

  const goBeginnning = () => {
    setCurrentStep(1);
  };

  const getStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne goToCreateBackup={goToNextScene} goToSync={goToSync} />;
      case 2:
        return <StepTwo goNext={goToNextScene} />;
      case 3:
        return <StepThree goNext={goBeginnning} />;
      default:
        return null;
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
