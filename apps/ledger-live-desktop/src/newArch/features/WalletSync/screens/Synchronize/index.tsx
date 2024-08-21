import { Flex } from "@ledgerhq/react-ui";
import React, { forwardRef, useImperativeHandle } from "react";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { FlowOptions, useFlows } from "../../hooks/useFlows";
import SynchronizeModeStep from "./01-SyncModeStep";
import SynchWithQRCodeStep from "./02-QRCodeStep";
import PinCodeStep from "./03-PinCodeStep";
import SyncFinalStep from "./04-SyncFinalStep";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";
import PinCodeErrorStep from "./05-PinCodeError";
import { BackProps, BackRef } from "../router";

const SynchronizeWallet = forwardRef<BackRef, BackProps>((_props, ref) => {
  const dispatch = useDispatch();

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const { currentStep, goToNextScene, goToPreviousScene, goToWelcomeScreenWalletSync } = useFlows();
  const { onClickTrack } = useWalletSyncAnalytics();

  const goBack = () => {
    if (currentStep === FlowOptions[Flow.Synchronize].steps[1]) {
      goToWelcomeScreenWalletSync();
    } else {
      goToPreviousScene();
    }
  };

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

      case Step.PinCodeError:
        return <PinCodeErrorStep />;

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
      alignItems={
        [Step.Synchronized, Step.PinCodeError].includes(currentStep) ? "center" : undefined
      }
      justifyContent={
        [Step.Synchronized, Step.PinCodeError].includes(currentStep) ? "center" : undefined
      }
    >
      {getStep()}
    </Flex>
  );
});

SynchronizeWallet.displayName = "SynchronizeWallet";

export default SynchronizeWallet;
