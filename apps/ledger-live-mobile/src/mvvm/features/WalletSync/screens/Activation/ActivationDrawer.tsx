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
  hasCustomHeader,
  canGoBack,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  onCreateKey,
  onQrCodeScanned,
  goBackToPreviousStep,
  handleClose,
  onCloseDrawer,
  qrProcess,
  currentOption,
  setCurrentOption,
}: ViewProps) {
  const CustomDrawerHeader = () => <DrawerHeader onClose={handleClose} />;

  return (
    <>
      <TrackScreen />
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        onClose={hasCustomHeader ? undefined : onCloseDrawer}
        CustomHeader={hasCustomHeader ? CustomDrawerHeader : undefined}
        hasBackButton={canGoBack}
        onBack={goBackToPreviousStep}
      >
        <Flex maxHeight={"90%"}>
          <ActivationFlow
            navigateToChooseSyncMethod={navigateToChooseSyncMethod}
            navigateToQrCodeMethod={navigateToQrCodeMethod}
            qrProcess={qrProcess}
            currentOption={currentOption}
            setOption={setCurrentOption}
            onQrCodeScanned={onQrCodeScanned}
            onCreateKey={onCreateKey}
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
