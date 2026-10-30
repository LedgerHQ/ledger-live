import React from "react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { usePerpsSignExecutorViewModel } from "./usePerpsSignExecutorViewModel";

type Props = Readonly<{
  request: PerpsSignRequest;
  onClose: () => void;
}>;

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

export function PerpsSignExecutor({ request, onClose }: Props): React.ReactElement | null {
  const { deviceInitializationInput, intent, onIntentJobComplete, onUserCancel } =
    usePerpsSignExecutorViewModel({ request, onClose });

  if (!deviceInitializationInput) return null;

  return (
    <DeviceIntentExecutor
      enabled
      sourceFlow="wallet_api"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={deviceInitializationInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      onIntentJobComplete={onIntentJobComplete}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
