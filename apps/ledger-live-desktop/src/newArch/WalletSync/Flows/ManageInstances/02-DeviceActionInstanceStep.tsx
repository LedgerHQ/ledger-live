import { getEnv } from "@ledgerhq/live-env";
import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

type Props = {
  goNext: () => void;
};

export default function DeviceActionInstanceStep({ goNext }: Props) {
  const dispatch = useDispatch();
  const request = { appName: "Trustchain" };

  const onError = () => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceErrorDeletion }));
  };

  return (
    <DeviceAction action={action} request={request} onResult={() => goNext()} onError={onError} />
  );
}
