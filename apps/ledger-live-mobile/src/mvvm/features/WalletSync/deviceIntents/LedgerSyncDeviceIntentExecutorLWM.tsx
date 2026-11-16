import React, { useEffect, useState } from "react";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type {
  DeviceConnectionParams,
  ExecutorState,
  Intent,
} from "@features/platform-device-intent";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
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
 * or installs the app before the job starts; mount one per run.
 */
export function LedgerSyncDeviceIntentExecutorLWM<Input, Result>({
  intent,
  onUserCancel,
  onExecutorStateChanged = noop,
  onIntentJobStateChanged,
}: LedgerSyncDeviceIntentExecutorLWMProps<Input, Result>): React.ReactElement | null {
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildDeviceInitializationInput({ appRequest: { appName: TRUSTCHAIN_APP_NAME } }).then(input => {
      if (!cancelled) setInitializationInput(input);
    }, onUserCancel);
    return () => {
      cancelled = true;
    };
  }, [onUserCancel]);

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
