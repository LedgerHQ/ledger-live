import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useFlows } from "../../hooks/useFlows";
import SynchronizeModeStep from "./01-SyncModeStep";
import SynchWithQRCodeStep from "./02-QRCodeStep";
import PinCodeStep from "./03-PinCodeStep";
import SyncFinalStep from "./04-SyncFinalStep";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";

const SynchronizeWallet = () => {
  const dispatch = useDispatch();

  const { currentStep, goToNextScene } = useFlows();
  const { onClickTrack } = useWalletSyncAnalytics();

  const startSyncWithDevice = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
    onClickTrack({
      button: "With your Ledger",
      page: AnalyticsPage.SyncMethod,
      flow: "Wallet Sync",
    });
  };

  const startSyncWithQRcode = () => {
    goToNextScene();
    onClickTrack({
      button: "Scan a QR code",
      page: AnalyticsPage.SyncMethod,
      flow: "Wallet Sync",
    });
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.SynchronizeMode:
        return (
          <SynchronizeModeStep
            goToQRCode={startSyncWithQRcode}
            goToSyncWithDevice={startSyncWithDevice}
          />
        );
      case Step.SynchronizeWithQRCode:
        return <SynchWithQRCodeStep />;
      case Step.PinCode:
        return <PinCodeStep />;
      case Step.Synchronized:
        return <SyncFinalStep />;
    }
  };

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX="40px"
      rowGap="48px"
      alignItems={currentStep === Step.Synchronized ? "center" : undefined}
      justifyContent={currentStep === Step.Synchronized ? "center" : undefined}
    >
      {getStep()}
    </Flex>
  );
};

export default SynchronizeWallet;
