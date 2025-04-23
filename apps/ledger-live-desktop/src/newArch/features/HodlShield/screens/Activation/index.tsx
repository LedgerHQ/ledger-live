import React, { forwardRef, useImperativeHandle } from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { FlowOptions, useFlows } from "../../hooks/useFlow";
import CreateOrSynchronizeStep from "./01-CreateOrSync";
import { BackRef } from "../router";
import DeviceAction from "~/renderer/components/DeviceAction";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";

const request = { appName: TRUSTCHAIN_APP_NAME };

type Props = {};

const HodlShieldActivation = forwardRef<BackRef, Props>((props, ref) => {
  const dispatch = useDispatch();
  const { currentStep, goToNextScene, goToPreviousScene, goToWelcomeScreenWalletSync } = useFlows();

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
  };

  const goToCreateBackup = () => {
    goToNextScene();
  };

  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.CreateOrSynchronize:
        return <CreateOrSynchronizeStep goToCreateBackup={goToCreateBackup} goToSync={goToSync} />;

      case Step.DeviceAction:
        return (
          <DeviceAction
            location={HOOKS_TRACKING_LOCATIONS.ledgerSync}
            action={createAction(connectApp)}
            request={request}
            onResult={({ device }) => {
              console.log("DeviceAction result", device);
            }}
            overridesPreferredDeviceModel={DeviceModelId.stax}
          />
        );
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
HodlShieldActivation.displayName = "WalletSyncActivation";
export default HodlShieldActivation;
