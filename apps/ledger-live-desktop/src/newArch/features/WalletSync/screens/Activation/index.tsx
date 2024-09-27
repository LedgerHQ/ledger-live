import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { FlowOptions, useFlows } from "../../hooks/useFlows";
import CreateOrSynchronizeStep from "./01-CreateOrSynchronizeStep";
import DeviceActionStep from "./02-DeviceActionStep";
import ActivationOrSynchroWithTrustchain from "./03-ActivationOrSynchroWithTrustchain";
import LoadingStep from "./04-LoadingStep";
import ActivationFinalStep from "./05-ActivationFinalStep";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import ErrorStep from "./06-ActivationOrSyncError";
import {
  AnalyticsPage,
  useLedgerSyncAnalytics,
  AnalyticsFlow,
} from "../../hooks/useLedgerSyncAnalytics";
import { BackRef, BackProps } from "../router";

const WalletSyncActivation = forwardRef<BackRef, BackProps>((_props, ref) => {
  const dispatch = useDispatch();
  const [device, setDevice] = useState<Device | null>(null);

  const { currentStep, goToNextScene, goToPreviousScene, goToWelcomeScreenWalletSync } = useFlows();

  const { onClickTrack } = useLedgerSyncAnalytics();

  useImperativeHandle(ref, () => ({
    goBack,
  }));

  const goBack = () => {
    if (currentStep === FlowOptions[Flow.Activation].steps[1]) {
      goToWelcomeScreenWalletSync();
    } else {
      goToPreviousScene();
    }
  };

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));
    onClickTrack({
      button: "I already turned it on",
      page: AnalyticsPage.Activation,
      flow: AnalyticsFlow,
    });
  };

  const goToCreateBackup = () => {
    goToNextScene();
    onClickTrack({
      button: "Turn on Ledger Sync",
      page: AnalyticsPage.Activation,
      flow: AnalyticsFlow,
    });
  };

  const goToActivationOrSynchroWithTrustchain = (device: Device) => {
    setDevice(device);
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronizeTrustChain }));
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.CreateOrSynchronize:
        return <CreateOrSynchronizeStep goToCreateBackup={goToCreateBackup} goToSync={goToSync} />;
      case Step.DeviceAction:
        return <DeviceActionStep goNext={goToActivationOrSynchroWithTrustchain} />;
      case Step.CreateOrSynchronizeTrustChain:
        return <ActivationOrSynchroWithTrustchain device={device} />;
      case Step.ActivationLoading:
        return <LoadingStep />;
      case Step.ActivationFinal:
        return <ActivationFinalStep isNewBackup={true} />;
      case Step.SynchronizationFinal:
        return <ActivationFinalStep isNewBackup={false} />;

      case Step.SynchronizationError:
        return <ErrorStep />;
    }
  };

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX="64px"
      alignItems="center"
      justifyContent="center"
    >
      {getStep()}
    </Flex>
  );
});
WalletSyncActivation.displayName = "WalletSyncActivation";
export default WalletSyncActivation;
