import React, { useEffect } from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import { getKeyRingDeviceInitialization } from "@features/platform-key-ring";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { DeviceModelId } from "@ledgerhq/devices";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

type Props = {
  goNext: (device: Device) => void;
};

export default function OpenOrInstallTrustChainApp({ goNext }: Props) {
  const action = useConnectAppAction();
  const request = getKeyRingDeviceInitialization().appRequest;

  useEffect(() => {
    setOriginFlow(HOOKS_TRACKING_LOCATIONS.ledgerSync);
  }, []);

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
