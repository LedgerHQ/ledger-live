import React from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { Steps } from "../../types/Activation";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

type Props = {
  currentStep: Steps;
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
};

const ActivationFlow = ({
  currentStep,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
}: Props) => {
  const getScene = () => {
    switch (currentStep) {
      case Steps.Activation:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ActivateLedgerSync} />
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
};

export default ActivationFlow;
