import React from "react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { HYPERLIQUID_DEVICE_CONNECTION_PARAMS } from "@features/platform-intent-hyperliquid-sign";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import {
  usePerpsSignExecutorViewModel,
  type PerpsSignManifest,
} from "./usePerpsSignExecutorViewModel";

type Props = Readonly<{
  request: PerpsSignRequest;
  manifest?: PerpsSignManifest;
  onClose: () => void;
}>;

const noop = () => undefined;

export function PerpsSignExecutor({
  request,
  manifest,
  onClose,
}: Props): React.ReactElement | null {
  const {
    analyticsProperties,
    deviceInitializationInput,
    intent,
    onIntentJobComplete,
    onUserCancel,
  } = usePerpsSignExecutorViewModel({ request, manifest, onClose });

  if (!deviceInitializationInput) return null;

  return (
    <DeviceIntentExecutor
      enabled
      sourceFlow="wallet_api"
      analyticsProperties={analyticsProperties}
      deviceConnectionParams={HYPERLIQUID_DEVICE_CONNECTION_PARAMS}
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
