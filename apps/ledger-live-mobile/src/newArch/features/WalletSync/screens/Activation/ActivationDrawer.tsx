import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import { useWindowDimensions } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import ActivationFlow from "../../components/Activation/ActivationFlow";
import { Steps } from "../../types/Activation";
import DrawerHeader from "../../components/Synchronize/DrawerHeader";
import useActivationDrawerModel from "./useActivationDrawerModel";

type ViewProps = ReturnType<typeof useActivationDrawerModel>;

type Props = {
  isOpen: boolean;
  startingStep: Steps;
  handleClose: () => void;
};

function View({
  isOpen,
  currentStep,
  hasCustomHeader,
  canGoBack,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  goBackToPreviousStep,
  handleClose,
  onCloseDrawer,
}: ViewProps) {
  const { height } = useWindowDimensions();
  const maxDrawerHeight = height - 180;
  const CustomDrawerHeader = () => <DrawerHeader onClose={handleClose} />;

  return (
    <>
      <TrackScreen />
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        onClose={onCloseDrawer}
        CustomHeader={hasCustomHeader ? CustomDrawerHeader : undefined}
        hasBackButton={canGoBack}
        onBack={goBackToPreviousStep}
      >
        <Flex maxHeight={maxDrawerHeight}>
          <ActivationFlow
            currentStep={currentStep}
            navigateToChooseSyncMethod={navigateToChooseSyncMethod}
            navigateToQrCodeMethod={navigateToQrCodeMethod}
          />
        </Flex>
      </QueuedDrawer>
    </>
  );
}

const ActivationDrawer = (props: Props) => {
  return <View {...useActivationDrawerModel(props)} />;
};

export default ActivationDrawer;
