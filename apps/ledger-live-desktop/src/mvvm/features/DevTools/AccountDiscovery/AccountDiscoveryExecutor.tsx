import React from "react";
import type { AccountDiscoveryRun } from "@devtools/bindings";
import type { CryptoCurrencyId } from "@domain/entity-currency-crypto";
import type { DeviceConnectionParams, Intent } from "@features/platform-device-intent";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { useAccountDiscoveryExecutorViewModel } from "./useAccountDiscoveryExecutorViewModel";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type RunCallbacks = Readonly<{
  onUserCancel: () => void;
  onError: (error: unknown) => void;
}>;

type AccountDiscoveryExecutorProps = RunCallbacks & Readonly<{ run: AccountDiscoveryRun | null }>;

/** Mounts a fresh executor on the currency's app for each scan or completion, and none while idle: unmounting stops the run, and no session idles between them. */
export function AccountDiscoveryExecutor({ run, ...props }: AccountDiscoveryExecutorProps) {
  if (!run) return null;
  if (run.kind === "complete") {
    return (
      <RunExecutor
        key={run.intent.uuid}
        currencyId={run.currencyId}
        intent={run.intent}
        {...props}
      />
    );
  }
  return (
    <RunExecutor key={run.intent.uuid} currencyId={run.currencyId} intent={run.intent} {...props} />
  );
}

function RunExecutor<JobState, Input, Result>({
  currencyId,
  intent,
  onUserCancel,
  onError,
}: RunCallbacks &
  Readonly<{ currencyId: CryptoCurrencyId; intent: Intent<JobState, Input, undefined, Result> }>) {
  const initializationInput = useAccountDiscoveryExecutorViewModel(currencyId, onError);

  if (!initializationInput) return null;

  return (
    <DeviceIntentExecutor
      enabled
      sourceFlow="debug"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initializationInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
