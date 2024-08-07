import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { useFlows } from "../../hooks/useFlows";
import CreateOrSynchronizeStep from "./01-CreateOrSynchronizeStep";
import DeviceActionStep from "./02-DeviceActionStep";
import ActivationOrSynchroWithTrustchain from "./03-ActivationOrSynchroWithTrustchain";
import ActivationFinalStep from "./04-ActivationFinalStep";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import ErrorStep from "./05-ActivationOrSyncError";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";

const WalletSyncActivation = () => {
  const dispatch = useDispatch();
  const [device, setDevice] = useState<Device | null>(null);

  const { currentStep, goToNextScene } = useFlows();

  const { onClickTrack } = useWalletSyncAnalytics();

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));
    onClickTrack({
      button: "Already created a key?",
      page: AnalyticsPage.Activation,
      flow: "Wallet Sync",
    });
  };

  const goToCreateBackup = () => {
    goToNextScene();
    onClickTrack({
      button: "create your backup",
      page: AnalyticsPage.Activation,
      flow: "Wallet Sync",
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
      rowGap="48px"
    >
      {getStep()}
    </Flex>
  );
};

export default WalletSyncActivation;
