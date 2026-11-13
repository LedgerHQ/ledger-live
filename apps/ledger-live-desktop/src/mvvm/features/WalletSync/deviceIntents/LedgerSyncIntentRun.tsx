import React, { useState } from "react";
import type { ExecutorState, Intent } from "@features/platform-device-intent";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import { LedgerSyncDeviceIntentExecutorLWD } from "./LedgerSyncDeviceIntentExecutorLWD";

type LedgerSyncIntentRunProps<Input, Result> = Readonly<{
  /** Builds the intent of the run, once, when the run mounts. */
  createRunIntent: () => Intent<LedgerSyncJobState, Input, undefined, Result>;
  onUserCancel: () => void;
  onExecutorStateChanged?: (executorState: ExecutorState) => void;
}>;

/** One run of a Ledger Sync intent on DIE: mount a new one to start a new run. */
export function LedgerSyncIntentRun<Input, Result>({
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
