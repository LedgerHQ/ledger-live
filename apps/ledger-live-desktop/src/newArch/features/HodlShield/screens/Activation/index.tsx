import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { FlowOptions, useFlows } from "../../hooks/useFlow";
import CreateOrSynchronizeStep from "./01-CreateOrSync";
import { BackRef } from "../router";
import DeviceAction from "~/renderer/components/DeviceAction";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { ApduBuilder, ApduParser, CommandUtils } from "@ledgerhq/device-management-kit";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";

const request = { appName: "Boilerplate" };

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

  const deviceManagementKit = useDeviceManagementKit();



  /* useEffect(() => {
    const testfn = async () => {
      const openAppApduArgs = {
        cla: 0xe0,
        ins: 0xd8,
        p1: 0x00,
        p2: 0x00,
      };
      const apdu = new ApduBuilder(openAppApduArgs).addAsciiStringToData("Bitcoin").build();

      // ### 2. Sending the APDU

      const apduResponse = await deviceManagementKit?.sendApdu({ sessionId, apdu });

      // ### 3. Parsing the result

      const parser = new ApduParser(apduResponse);

      if (!CommandUtils.isSuccessResponse(apduResponse)) {
        throw new Error(
          `Unexpected status word: ${parser.encodeToHexaString(apduResponse.statusCode)}`,
        );
      }
    };
  }, []);
 */
  const getStep = () => {
    switch (currentStep) {
      default:
      case Step.CreateOrSynchronize:
        return <CreateOrSynchronizeStep goToCreateBackup={goToCreateBackup} goToSync={goToSync} />;

      case Step.DeviceAction:
        return (
          <DeviceAction
            action={createAction(connectApp)}
            request={request}
            onResult={metadata => {
              console.log("DeviceAction result", metadata);
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
