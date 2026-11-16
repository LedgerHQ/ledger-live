import React from "react";
import type { IntentWalletSyncRun } from "@devtools/bindings";
import { LedgerSyncDeviceIntentExecutorLWM } from "../../WalletSync/deviceIntents/LedgerSyncDeviceIntentExecutorLWM";

type IntentWalletSyncExecutorProps = Readonly<{
  run: IntentWalletSyncRun | null;
  onUserCancel: () => void;
}>;

/** Mounts a fresh executor for each devtool run, and none while idle. */
export function IntentWalletSyncExecutor({ run, onUserCancel }: IntentWalletSyncExecutorProps) {
  switch (run?.operation) {
    case "add-member":
      return (
        <LedgerSyncDeviceIntentExecutorLWM
          key={run.intent.uuid}
          intent={run.intent}
          onUserCancel={onUserCancel}
        />
      );
    case "remove-member":
      return (
        <LedgerSyncDeviceIntentExecutorLWM
          key={run.intent.uuid}
          intent={run.intent}
          onUserCancel={onUserCancel}
        />
      );
    default:
      return null;
  }
}
