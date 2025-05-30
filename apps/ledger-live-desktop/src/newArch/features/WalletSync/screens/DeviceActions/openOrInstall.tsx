import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { DeviceModelId } from "@ledgerhq/devices";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

type Props = {
  goNext: (device: Device) => void;
};

export default function OpenOrInstallTrustChainApp({ goNext }: Props) {
  const action = useConnectAppAction();
  const request = { appName: TRUSTCHAIN_APP_NAME };
  return (
    <DeviceAction
      location={HOOKS_TRACKING_LOCATIONS.ledgerSync}
      action={action}
      request={request}
      onResult={({ device }) => goNext(device)}
      overridesPreferredDeviceModel={DeviceModelId.stax}
    />
  );
}
