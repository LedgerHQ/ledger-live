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
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { useObservable } from "@ledgerhq/live-common/observable";
import { StatusCodes } from "@ledgerhq/hw-transport";
const request = { appName: "Boilerplate" };

type Props = {};

const HodlShieldActivation = forwardRef<BackRef, Props>((props, ref) => {
  const dispatch = useDispatch();
  const activeSession = useObservable(activeDeviceSessionSubject);
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

  //  const deviceManagementKit = useDeviceManagementKit();
  useEffect(() => {
    console.log(activeSession);
    const testfn = async () => {
      if (!activeSession) return;

      console.log("Run testFn");
      const openAppApduArgs = {
        cla: 0xe0,
        ins: 0xd8,
        p1: 0x00,
        p2: 0x00,
      };
      const data = new TextEncoder().encode("Bitcoin");
      await activeSession.transport
        .send(
          openAppApduArgs.cla,
          openAppApduArgs.ins,
          openAppApduArgs.p1,
          openAppApduArgs.p2,
          Buffer.from(data),
        )
        .then(response => {
          const status = response.readUInt16BE(response.length - 2);

          switch (status) {
            case StatusCodes.OK:
              console.log("Status OK");
              return response.slice(0, response.length - 2).toString("utf-8");
            case StatusCodes.DEVICE_NOT_ONBOARDED:
            case StatusCodes.DEVICE_NOT_ONBOARDED_2:
              return "";
          }
        })
        .then(str => console.log("Buffer out", str))
        .catch(e => {
          console.log("Error", e);
        });
    };
    testfn();
  }, [activeSession]);
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
