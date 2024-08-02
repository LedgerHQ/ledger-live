import React from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { Steps } from "../../types/Activation";
import useActivationFlowModel from "./useActivationFlowModel";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";

type ViewProps = ReturnType<typeof useActivationFlowModel>;

type Props = {
  startingStep: Steps;
  onStepChange?: (step: Steps) => void;
  onGoBack?: (callback: () => void) => void;
};

function View({ currentStep, navigateToChooseSyncMethod, navigateToQrCodeMethod }: ViewProps) {
  const getScene = () => {
    switch (currentStep) {
      case Steps.Activation:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ActivateWalletSync} />
            <Activation onSyncMethodPress={navigateToChooseSyncMethod} />
          </>
        );
      case Steps.ChooseSyncMethod:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ChooseSyncMethod} />
            <ChooseSyncMethod onScanMethodPress={navigateToQrCodeMethod} />
          </>
        );
      case Steps.QrCodeMethod:
        return <QrCodeMethod />;
      default:
        return null;
    }
  };

  return getScene();
}

const ActivationFlow = (props: Props) => {
  return <View {...useActivationFlowModel(props)} />;
};

export default ActivationFlow;
