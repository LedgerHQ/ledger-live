import React from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import PinCodeInput from "../../screens/Synchronize/PinCodeInput";
import { Steps } from "../../types/Activation";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

type Props = {
  currentStep: Steps;
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
  onQrCodeScanned: (data: string) => void;
};

const ActivationFlow = ({
  currentStep,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  onQrCodeScanned,
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
        return <QrCodeMethod onQrCodeScanned={onQrCodeScanned} />;
      case Steps.PinCodeInput:
        return <PinCodeInput />;
      default:
        return null;
    }
  };

  return getScene();
};

export default ActivationFlow;
