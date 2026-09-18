import React, { useEffect } from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

// LKRP_MIGRATION: TRUSTCHAIN_APP_NAME → @features/platform-lkrp constants until the HW adapter owns it.
// LKRP_MIGRATION: hw crypto/codec/device → @shared/lkrp ports (LkrpCrypto, codec, LkrpDeviceLayer). features/domain/shared must not import libs/*.
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { DeviceModelId } from "@ledgerhq/devices";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

type Props = {
  goNext: (device: Device) => void;
};

export default function OpenOrInstallTrustChainApp({ goNext }: Props) {
  const action = useConnectAppAction();
  const request = { appName: TRUSTCHAIN_APP_NAME };

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
