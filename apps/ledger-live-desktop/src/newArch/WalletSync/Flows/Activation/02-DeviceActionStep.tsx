import { getEnv } from "@ledgerhq/live-env";
import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

type Props = {
  goNext: (device: Device) => void;
};

export default function DeviceActionStep({ goNext }: Props) {
  const request = { appName: "Trustchain" };
  return (
    <DeviceAction action={action} request={request} onResult={({ device }) => goNext(device)} />
  );
}
