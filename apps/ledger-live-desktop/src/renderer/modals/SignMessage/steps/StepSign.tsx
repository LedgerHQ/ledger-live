import React, { useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { getEnv } from "@ledgerhq/live-env";
import { StepProps } from "../types";
import { signMessageExec, createAction } from "@ledgerhq/live-common/hw/signMessage/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { closeModal } from "~/renderer/reducers/modals";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

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
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  const action = createAction(
    getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
    getEnv("MOCK") ? mockedEventEmitter : signMessageExec,
  );
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
