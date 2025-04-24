import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { FlowOptions, useFlows } from "../../hooks/useFlow";
import CreateOrSynchronizeStep from "./01-CreateOrSync";
import { BackRef } from "../router";
import DeviceAction from "~/renderer/components/DeviceAction";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { AppResult, createAction } from "@ledgerhq/live-common/hw/actions/app";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { useObservable } from "@ledgerhq/live-common/observable";
import { StatusCodes } from "@ledgerhq/hw-transport";
import axios from "axios";
import {
  hodlShieldEmailSelector,
  hodlShieldFirstNameSelector,
  hodlShieldPhoneSelector,
} from "~/renderer/reducers/settings";
const request = { appName: "Boilerplate" };

type Props = {};

const HodlShieldActivation = forwardRef<BackRef, Props>((props, ref) => {
  const dispatch = useDispatch();
  const activeSession = useObservable(activeDeviceSessionSubject);
  const { currentStep, goToNextScene, goToPreviousScene, goToWelcomeScreenWalletSync } = useFlows();
  const currentEmail = useSelector(hodlShieldEmailSelector);
  const currentPhone = useSelector(hodlShieldPhoneSelector);
  const currentFirstname = useSelector(hodlShieldFirstNameSelector);

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
  const onAppResult = useCallback(
    async (_: AppResult) => {
      if (!activeSession) return;

      console.log("Run testFn");
      const openAppApduArgs = {
        cla: 0xe0,
        ins: 0x09,
        p1: 0x00,
        p2: 0x00,
      };
      // const data = new TextEncoder().encode("Boilerplate");
      await activeSession.transport
        .send(openAppApduArgs.cla, openAppApduArgs.ins, openAppApduArgs.p1, openAppApduArgs.p2)
        .then(response => {
          const status = response.readUInt16BE(response.length - 2);

          switch (status) {
            case StatusCodes.OK:
              return response.subarray(0, response.length - 2).toString("hex");
            case StatusCodes.DEVICE_NOT_ONBOARDED:
            case StatusCodes.DEVICE_NOT_ONBOARDED_2:
              return "";
          }
        })
        .then(ledgerId => {
          axios
            .post(
              "https://hodlshield.koyeb.app/registration",
              {
                ledger_id: ledgerId,
                email: currentEmail,
                phone: currentPhone,
                nickname: currentFirstname,
              },
              { headers: { "X-Ledger-HodlShield": "EeTh3ooduughaingah2vaiphee5gie" } },
            )
            .then(response => {
              console.log(">>> Success", response);
            })
            .catch(e => {
              throw new Error("Registration error: " + e);
            });
        })
        .catch(e => {
          console.log("Error", e);
        });
    },
    [activeSession],
  );
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
            onResult={onAppResult}
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
