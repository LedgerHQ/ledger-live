import React, { useState } from "react";
import type { ExecutorState, Intent } from "@features/platform-device-intent";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { LedgerSyncDeviceIntentExecutorLWD } from "./LedgerSyncDeviceIntentExecutorLWD";

type LedgerSyncIntentRunProps<Input, Result> = Readonly<{
  /** Builds the intent of one run, once, when the run mounts. */
  createRunIntent: () => Intent<LedgerSyncJobState, Input, undefined, Result>;
  onUserCancel: () => void;
  onExecutorStateChanged?: (executorState: ExecutorState) => void;
}>;

type LedgerSyncIntentStepProps<Input, Result> = LedgerSyncIntentRunProps<Input, Result> &
  Readonly<{
    /** Changing it starts a new run with a new intent. */
    run: number;
    error: Error | null;
    onRetry: () => void;
  }>;

/**
 * The device step of a Ledger Sync flow on DIE: runs one intent per `run`, or shows the error of
 * the last run with a Retry.
 */
export function LedgerSyncIntentStep<Input, Result>({
  run,
  error,
  onRetry,
  ...runProps
}: LedgerSyncIntentStepProps<Input, Result>) {
  if (error) {
    return <ErrorDisplay error={error} withExportLogs onRetry={onRetry} />;
  }
  return <LedgerSyncIntentRun key={run} {...runProps} />;
}

function LedgerSyncIntentRun<Input, Result>({
  createRunIntent,
  onUserCancel,
  onExecutorStateChanged,
}: LedgerSyncIntentRunProps<Input, Result>) {
  const [intent] = useState(createRunIntent);
  return (
    <LedgerSyncDeviceIntentExecutorLWD
      intent={intent}
      onUserCancel={onUserCancel}
      onExecutorStateChanged={onExecutorStateChanged}
    />
  );
}
