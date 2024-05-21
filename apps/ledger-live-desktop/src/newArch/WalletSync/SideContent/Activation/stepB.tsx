import { getEnv } from "@ledgerhq/live-env";
import React, { useMemo } from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

type Props = {
  goNext: () => void;
};

export default function StepTwo({ goNext }: Props) {
  //const request = { appName: "BOLOS" };
  const currency = getCryptoCurrencyById("bitcoin");
  const request = useMemo(() => ({ currency }), [currency]);
  return <DeviceAction action={action} request={request} onResult={() => goNext()} />;
}
