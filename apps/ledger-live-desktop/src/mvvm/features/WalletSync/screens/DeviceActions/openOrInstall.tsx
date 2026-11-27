import React, { useEffect } from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import {
  getKeyRingDeviceInitialization,
  ledgerSyncDeviceUnsupportedFailure,
} from "@features/platform-key-ring";
import { ledgerSyncErrorForDisplay } from "@features/platform-ledger-sync";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { DeviceModelId } from "@ledgerhq/devices";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

type Props = {
  goNext: (device: Device) => void;
};

export default function OpenOrInstallTrustChainApp({ goNext }: Props) {
  const action = useConnectAppAction();
  const initialization = getKeyRingDeviceInitialization();

  useEffect(() => {
    setOriginFlow(HOOKS_TRACKING_LOCATIONS.ledgerSync);
  }, []);

  if (initialization.kind === "os-feature") {
    const { error } = ledgerSyncDeviceUnsupportedFailure(initialization);
    return <ErrorDisplay error={ledgerSyncErrorForDisplay(error)} withExportLogs />;
  }

  return (
    <DeviceAction
      location={HOOKS_TRACKING_LOCATIONS.ledgerSync}
      action={action}
      request={initialization.appRequest}
      onResult={({ device }) => goNext(device)}
      overridesPreferredDeviceModel={DeviceModelId.stax}
    />
  );
}
