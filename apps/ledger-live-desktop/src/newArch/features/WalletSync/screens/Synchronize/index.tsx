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
import {
  AnalyticsPage,
  useLedgerSyncAnalytics,
  AnalyticsFlow,
} from "../../hooks/useLedgerSyncAnalytics";
import PinCodeErrorStep from "./05-PinCodeError";
import UnbackedErrorStep from "./05-UnbackedError";
import { BackProps, BackRef } from "../router";
import AlreadyCreatedWithSameSeedStep from "./06-ActivationAlreadyCreatedSame";
import AlreadyCreatedOtherSeedStep from "./07-ActivationAlreadyCreatedOther";
import ActivationLoadingStep from "../Activation/04-LoadingStep";

const SynchronizeWallet = forwardRef<BackRef, BackProps>((_props, ref) => {
  const dispatch = useDispatch();

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const {
    currentStep,
    goToNextScene,
    goToPreviousScene,
    goToWelcomeScreenWalletSync,
    currentFlow,
  } = useFlows();
  const { onClickTrack } = useLedgerSyncAnalytics();

  const goBack = () => {
    if (
      currentStep === FlowOptions[Flow.Synchronize].steps[1] ||
      (currentFlow === Flow.Synchronize && currentStep === Step.SynchronizeWithQRCode)
    ) {
      goToWelcomeScreenWalletSync();
    } else {
      goToPreviousScene();
    }
  };

  const startSyncWithDevice = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
    onClickTrack({
      button: "Use your Ledger",
      page: AnalyticsPage.SyncMethod,
      flow: AnalyticsFlow,
    });
  };

  const startSyncWithQRcode = () => {
    goToNextScene();
    onClickTrack({
      button: "Display QR code",
      page: AnalyticsPage.SyncMethod,
      flow: AnalyticsFlow,
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

      case Step.UnbackedError:
        return <UnbackedErrorStep />;

      case Step.AlreadySecuredSameSeed:
        return <AlreadyCreatedWithSameSeedStep />;
      case Step.AlreadySecuredOtherSeed:
        return <AlreadyCreatedOtherSeedStep />;
      case Step.SynchronizeLoading:
        return <ActivationLoadingStep />;

      case Step.Synchronized:
        return <SyncFinalStep />;
    }
  };

  const centeredItems = [
    Step.Synchronized,
    Step.PinCodeError,
    Step.UnbackedError,
    Step.AlreadySecuredSameSeed,
    Step.AlreadySecuredOtherSeed,
  ];

  const withoutPaddingItems = [Step.SynchronizeLoading];

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX={withoutPaddingItems.includes(currentStep) ? 0 : "40px"}
      rowGap="48px"
      alignItems={centeredItems.includes(currentStep) ? "center" : undefined}
      justifyContent={centeredItems.includes(currentStep) ? "center" : undefined}
    >
      {getStep()}
    </Flex>
  );
});

SynchronizeWallet.displayName = "SynchronizeWallet";

export default SynchronizeWallet;
