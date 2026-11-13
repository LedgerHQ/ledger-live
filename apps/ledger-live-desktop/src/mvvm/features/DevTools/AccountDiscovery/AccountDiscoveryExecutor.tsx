import React, { useEffect, useState } from "react";
import type { AccountDiscoveryRun } from "@devtools/bindings";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentResult,
} from "@features/platform-account-discovery-intent";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type AccountDiscoveryExecutorProps = Readonly<{
  run: AccountDiscoveryRun | null;
  onUserCancel: () => void;
}>;

/** Mounts a fresh executor on the currency's app for each scan, and none while idle: unmounting stops the scan. The app name alone leaves every derivation to the discovery job. */
export function AccountDiscoveryExecutor({ run, onUserCancel }: AccountDiscoveryExecutorProps) {
  if (!run) return null;
  return <RunExecutor key={run.intent.uuid} run={run} onUserCancel={onUserCancel} />;
}

function RunExecutor({
  run,
  onUserCancel,
}: Readonly<{ run: AccountDiscoveryRun; onUserCancel: () => void }>) {
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);
  const { currencyId } = run;

  useEffect(() => {
    let cancelled = false;
    buildDeviceInitializationInput({
      appRequest: { appName: getCryptoCurrencyById(currencyId).managerAppName },
    }).then(input => {
      if (!cancelled) setInitializationInput(input);
    }, onUserCancel);
    return () => {
      cancelled = true;
    };
  }, [currencyId, onUserCancel]);

  if (!initializationInput) return null;

  return (
    <DeviceIntentExecutor<
      AccountDiscoveryIntentJobState,
      AccountDiscoveryIntentInput,
      undefined,
      AccountDiscoveryIntentResult
    >
      enabled
      sourceFlow="debug"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initializationInput}
      intent={run.intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
