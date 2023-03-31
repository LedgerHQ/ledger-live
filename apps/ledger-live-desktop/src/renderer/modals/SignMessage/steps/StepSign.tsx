import React from "react";
import { useDispatch } from "react-redux";
import { getEnv } from "@ledgerhq/live-common/env";
import { StepProps } from "../types";
import { signMessageExec, createAction } from "@ledgerhq/live-common/hw/signMessage/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { closeModal } from "~/renderer/actions/modals";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
const action = createAction(
  getEnv("MOCK") ? mockedEventEmitter : connectApp,
  getEnv("MOCK") ? mockedEventEmitter : signMessageExec,
);
export default function StepSign({
  account,
  message,
  onConfirmationHandler,
  onFailHandler,
}: StepProps) {
  const dispatch = useDispatch();
  return (
    <DeviceAction
      action={action}
      request={{
        account,
        message,
      }}
      onResult={result => {
        dispatch(closeModal("MODAL_SIGN_MESSAGE"));
        if (result.error) {
          onFailHandler(result.error);
        } else if (result.signature) {
          onConfirmationHandler(result.signature);
        }
      }}
    />
  );
}
