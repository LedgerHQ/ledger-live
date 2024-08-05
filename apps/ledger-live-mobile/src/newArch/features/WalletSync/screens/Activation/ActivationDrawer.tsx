import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

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
  onQrCodeScanned,
  goBackToPreviousStep,
  handleClose,
  onCloseDrawer,
}: ViewProps) {
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
        <Flex maxHeight={"90%"}>
          <ActivationFlow
            currentStep={currentStep}
            navigateToChooseSyncMethod={navigateToChooseSyncMethod}
            navigateToQrCodeMethod={navigateToQrCodeMethod}
            onQrCodeScanned={onQrCodeScanned}
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
