import React, { useState } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import { useWindowDimensions } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import ActivationFlow from "../../components/Activation/ActivationFlow";
import { Steps } from "../../types/Activation";
import DrawerHeader from "../../components/Synchronize/DrawerHeader";

type Props = {
  isOpen: boolean;
  startingStep: Steps;
  handleClose: () => void;
};

const ActivationDrawer = ({ isOpen, startingStep, handleClose }: Props) => {
  const [currentStep, setCurrentStep] = useState<Steps>(startingStep);
  const { height } = useWindowDimensions();
  const maxDrawerHeight = height - 180;

  const CustomDrawerHeader = () => <DrawerHeader onClose={handleClose} />;

  const handleStepChange = (step: Steps) => setCurrentStep(step);

  let goBackCallback: () => void;

  const hasCustomHeader = currentStep === Steps.QrCodeMethod && startingStep === Steps.Activation;

  const canGoBack = currentStep === Steps.ChooseSyncMethod && startingStep === Steps.Activation;

  return (
    <>
      <TrackScreen />
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        onClose={handleClose}
        CustomHeader={hasCustomHeader ? CustomDrawerHeader : undefined}
        hasBackButton={canGoBack}
        onBack={() => goBackCallback()}
      >
        <Flex maxHeight={maxDrawerHeight}>
          <ActivationFlow
            startingStep={currentStep}
            onStepChange={handleStepChange}
            onGoBack={callback => (goBackCallback = callback)}
          />
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default ActivationDrawer;
