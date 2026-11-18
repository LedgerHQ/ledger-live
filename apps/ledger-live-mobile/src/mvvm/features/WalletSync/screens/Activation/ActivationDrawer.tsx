import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@features/platform-feature-flags";
import ActivationFlow from "../../components/Activation/ActivationFlow";
import { Steps } from "../../types/Activation";
import DrawerHeader from "../../components/Synchronize/DrawerHeader";
import useActivationDrawerModel from "./useActivationDrawerModel";
import { LedgerSyncBottomSheet } from "./LedgerSyncBottomSheet";

type ViewProps = ReturnType<typeof useActivationDrawerModel>;

type Props = {
  isOpen: boolean;
  startingStep: Steps;
  handleClose: () => void;
  handleNavigate?: () => void;
};

function View({
  isOpen,
  hasCustomHeader,
  hasScrollableInstructions,
  canGoBack,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  navigateToWalletSyncActivationProcess,
  onCreateKey,
  onQrCodeScanned,
  goBackToPreviousStep,
  handleClose,
  onCloseDrawer,
  qrProcess,
  currentOption,
  setCurrentOption,
  deviceIntentStepElement,
}: ViewProps) {
  const isLumenSheet = useFeature("lwmLedgerSyncDie")?.enabled === true;
  const CustomDrawerHeader = () => <DrawerHeader onClose={handleClose} />;

  const flow = (
    <ActivationFlow
      navigateToChooseSyncMethod={navigateToChooseSyncMethod}
      navigateToQrCodeMethod={navigateToQrCodeMethod}
      navigateToWalletSyncActivationProcess={navigateToWalletSyncActivationProcess}
      qrProcess={qrProcess}
      currentOption={currentOption}
      setOption={setCurrentOption}
      onQrCodeScanned={onQrCodeScanned}
      onCreateKey={onCreateKey}
    />
  );

  if (isLumenSheet) {
    return (
      <>
        <TrackScreen />
        <LedgerSyncBottomSheet
          isOpen={isOpen}
          onClose={onCloseDrawer}
          customHeader={hasCustomHeader ? <DrawerHeader onClose={handleClose} /> : undefined}
          hasBackButton={canGoBack}
          onBack={goBackToPreviousStep}
          enableContentPanningGesture={!hasScrollableInstructions}
          testID="wallet-sync-activation-sheet"
        >
          {flow}
        </LedgerSyncBottomSheet>
        {deviceIntentStepElement}
      </>
    );
  }

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
        <Flex maxHeight={"90%"}>{flow}</Flex>
      </QueuedDrawer>
      {deviceIntentStepElement}
    </>
  );
}

const ActivationDrawer = (props: Props) => {
  return <View {...useActivationDrawerModel(props)} />;
};

export default ActivationDrawer;
