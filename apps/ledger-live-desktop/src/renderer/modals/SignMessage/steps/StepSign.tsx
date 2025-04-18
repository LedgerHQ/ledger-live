import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { getEnv } from "@ledgerhq/live-env";
import { StepProps } from "../types";
import { signMessageExec, createAction } from "@ledgerhq/live-common/hw/signMessage/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { closeModal } from "~/renderer/actions/modals";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";

const action = createAction(
  getEnv("MOCK") ? mockedEventEmitter : connectApp,
  getEnv("MOCK") ? mockedEventEmitter : signMessageExec,
);

export default function StepSign({
  account,
  message,
  useApp,
  dependencies,
  onConfirmationHandler,
  onFailHandler,
  isACRE,
}: StepProps) {
  const dispatch = useDispatch();
  const request = useMemo(() => {
    const appRequests = dependenciesToAppRequests(dependencies);
    return {
      account,
      message,
      appName: useApp,
      dependencies: appRequests,
      isACRE,
    };
  }, [account, dependencies, isACRE, message, useApp]);
  return (
    <DeviceAction
      action={action}
      request={request}
      onResult={r => {
        const result = r as {
          error: Error | null | undefined;
          signature: string | null | undefined;
        };
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
