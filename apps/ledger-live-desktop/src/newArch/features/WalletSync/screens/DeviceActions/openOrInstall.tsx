import { getEnv } from "@ledgerhq/live-env";
import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

type Props = {
  goNext: (device: Device) => void;
};

export default function OpenOrInstallTrustChainApp({ goNext }: Props) {
  const request = { appName: TRUSTCHAIN_APP_NAME };
  return (
    <DeviceAction
      location={HOOKS_TRACKING_LOCATIONS.ledgerSync}
      action={action}
      request={request}
      onResult={({ device }) => goNext(device)}
    />
  );
}
