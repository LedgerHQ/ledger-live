import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { getEnv } from "@ledgerhq/live-env";
import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { createAction } from "@ledgerhq/live-common/hw/actions/manager";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectManager);

type Props = {
  goNext: () => void;
};

export function StepTwo({ goNext }: Props) {
  return <DeviceAction action={action} request={null} onResult={() => goNext()} />;
}
