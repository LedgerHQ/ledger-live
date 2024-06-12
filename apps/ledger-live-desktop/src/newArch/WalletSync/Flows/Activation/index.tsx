import React from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { useFlows } from "../useFlows";
import CreateOrSynchronizeStep from "./01-CreateOrSynchronizeStep";
import DeviceActionStep from "./02-DeviceActionStep";
import ActivationOrSynchroWithTrustchain from "./03-ActivationOrSynchroWithTrustchain";
import ActivationFinalStep from "./04-ActivationFinalStep";
import { useBackup } from "../ManageBackup/useBackup";
import { useInstances } from "../ManageInstances/useInstances";

const WalletSyncActivation = () => {
  const dispatch = useDispatch();
  const { hasBackup, createBackup } = useBackup();
  const { createInstance } = useInstances();

  const { currentStep, goToNextScene } = useFlows({ flow: Flow.Activation });

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));
  };

  const createNewBackupAction = () => {
    goToNextScene();
    createBackup();
    createInstance({
      name: "Iphone 8",
      id: "1",
      typeOfDevice: "mobile",
    });
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.CreateOrSynchronize:
        return <CreateOrSynchronizeStep goToCreateBackup={goToNextScene} goToSync={goToSync} />;
      case Step.DeviceAction:
        return <DeviceActionStep goNext={goToNextScene} />;
      case Step.CreateOrSynchronizeTrustChain:
        return <ActivationOrSynchroWithTrustchain goNext={createNewBackupAction} />;
      case Step.ActivationFinal:
        return <ActivationFinalStep hasBackup={hasBackup} />;
    }
  };

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX="64px"
      alignSelf="center"
      justifyContent="center"
      rowGap="48px"
    >
      {getStep()}
    </Flex>
  );
};

export default WalletSyncActivation;
