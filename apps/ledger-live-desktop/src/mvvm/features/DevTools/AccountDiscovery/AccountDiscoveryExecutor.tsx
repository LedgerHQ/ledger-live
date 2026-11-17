import React from "react";
import type { AccountDiscoveryRun } from "@devtools/bindings";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { useAccountDiscoveryExecutorViewModel } from "./useAccountDiscoveryExecutorViewModel";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type AccountDiscoveryExecutorProps = Readonly<{
  run: AccountDiscoveryRun | null;
  onUserCancel: () => void;
  onError: (error: unknown) => void;
}>;

/** Mounts a fresh executor on the currency's app for each scan, and none while idle: unmounting stops the scan. The app name alone leaves every derivation to the discovery job. */
export function AccountDiscoveryExecutor({
  run,
  onUserCancel,
  onError,
}: AccountDiscoveryExecutorProps) {
  if (!run) return null;
  return (
    <RunExecutor key={run.intent.uuid} run={run} onUserCancel={onUserCancel} onError={onError} />
  );
}

function RunExecutor({
  run,
  onUserCancel,
  onError,
}: Readonly<{
  run: AccountDiscoveryRun;
  onUserCancel: () => void;
  onError: (error: unknown) => void;
}>) {
  const { initializationInput, initializerConfig } = useAccountDiscoveryExecutorViewModel(
    run.currencyId,
    onError,
  );

  if (!initializationInput) return null;

  return (
    <DeviceIntentExecutor
      enabled
      sourceFlow="debug"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initializationInput}
      initializerConfig={initializerConfig}
      intent={run.intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
