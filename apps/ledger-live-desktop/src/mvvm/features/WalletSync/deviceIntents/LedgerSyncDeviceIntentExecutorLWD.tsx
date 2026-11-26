import React, { useEffect, useState } from "react";
import type {
  DeviceConnectionParams,
  ExecutorState,
  Intent,
} from "@features/platform-device-intent";
import {
  getKeyRingDeviceInitialization,
  ledgerSyncDeviceUnsupportedFailure,
  type LedgerSyncJobState,
} from "@features/platform-key-ring";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type LedgerSyncDeviceIntentExecutorLWDProps<Input, Result> = Readonly<{
  intent: Intent<LedgerSyncJobState, Input, undefined, Result>;
  onUserCancel: () => void;
  onExecutorStateChanged?: (executorState: ExecutorState) => void;
}>;

/**
 * Runs a Ledger Sync intent in the Ledger Sync device app. The executor opens
 * or installs the app before the job starts; mount one per run. A device
 * requirement the executor cannot express fails the intent as `device-unsupported`.
 */
export function LedgerSyncDeviceIntentExecutorLWD<Input, Result>({
  intent,
  onUserCancel,
  onExecutorStateChanged = noop,
}: LedgerSyncDeviceIntentExecutorLWDProps<Input, Result>): React.ReactElement | null {
  const [initialization] = useState(getKeyRingDeviceInitialization);
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);

  useEffect(() => {
    if (initialization.kind !== "os-feature") return;
    intent.onJobStateChanged?.(ledgerSyncDeviceUnsupportedFailure(initialization));
  }, [initialization, intent]);

  useEffect(() => {
    if (initialization.kind !== "app") return;
    let cancelled = false;
    buildDeviceInitializationInput(initialization).then(input => {
      if (!cancelled) setInitializationInput(input);
    }, onUserCancel);
    return () => {
      cancelled = true;
    };
  }, [initialization, onUserCancel]);

  if (!initializationInput) return null;

  return (
    <DeviceIntentExecutor<LedgerSyncJobState, Input, undefined, Result>
      enabled
      sourceFlow="ledger_sync"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initializationInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={onExecutorStateChanged}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
