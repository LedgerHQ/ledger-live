import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, walletSyncStateSelector } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";
import { useFlows } from "LLD/WalletSync/hooks/useFlows";
import StepOne from "./stepA";
import StepTwo from "./stepB";
import StepThree from "./stepC";

const WalletSyncActivation = () => {
  const dispatch = useDispatch();
  const HAS_BACKUP = false;

  const { currentStep, goToNextScene, setCurrentStep } = useFlows({ flow: Flow.Activation });

  const goToSync = () => {
    dispatch(setFlow(Flow.Sync));
  };

  const goToBeginnning = () => {
    setCurrentStep(1);
  };

  const getStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne goToCreateBackup={goToNextScene} goToSync={goToSync} />;
      case 2:
      //return <StepTwo goNext={goToNextScene} />;
      case 3:
        return <StepThree hasBackup={HAS_BACKUP} />;
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
