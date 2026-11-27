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
} from "LLM/components/DeviceIntentExecutor";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type LedgerSyncDeviceIntentExecutorLWMProps<Input, Result> = Readonly<{
  intent: Intent<LedgerSyncJobState, Input, undefined, Result>;
  onUserCancel: () => void;
  onExecutorStateChanged?: (executorState: ExecutorState) => void;
  onIntentJobStateChanged?: (jobState: LedgerSyncJobState) => void;
}>;

/**
 * Runs a Ledger Sync intent in the Ledger Sync device app. The executor opens
 * or installs the app before the job starts; mount one per run. A device
 * requirement the executor cannot express fails the intent as `device-unsupported`.
 */
export function LedgerSyncDeviceIntentExecutorLWM<Input, Result>({
  intent,
  onUserCancel,
  onExecutorStateChanged = noop,
  onIntentJobStateChanged,
}: LedgerSyncDeviceIntentExecutorLWMProps<Input, Result>): React.ReactElement | null {
  const [initialization] = useState(getKeyRingDeviceInitialization);
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);

  useEffect(() => {
    if (initialization.kind !== "os-feature") return;
    const failure = ledgerSyncDeviceUnsupportedFailure(initialization);
    intent.onJobStateChanged?.(failure);
    onIntentJobStateChanged?.(failure);
  }, [initialization, intent, onIntentJobStateChanged]);

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
      onIntentJobStateChanged={onIntentJobStateChanged}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
