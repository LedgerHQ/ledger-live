import React from "react";
import type { Intent } from "@features/platform-device-intent";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import GenericFollowInstructionsDrawer from "../screens/FollowInstructions";
import { LedgerSyncDeviceIntentExecutorLWM } from "./LedgerSyncDeviceIntentExecutorLWM";
import type { LedgerSyncIntentStep } from "./useLedgerSyncIntentStep";

type LedgerSyncIntentStepLWMProps<Input, Result> = Readonly<{
  step: LedgerSyncIntentStep<Intent<LedgerSyncJobState, Input, undefined, Result>>;
}>;

/** The executor while a run is on, then the existing error drawer if it failed. */
export function LedgerSyncIntentStepLWM<Input, Result>({
  step,
}: LedgerSyncIntentStepLWMProps<Input, Result>) {
  const { phase } = step;

  if (phase.type === "running") {
    return (
      <LedgerSyncDeviceIntentExecutorLWM
        key={phase.runId}
        intent={phase.intent}
        onUserCancel={step.onUserCancel}
        onExecutorStateChanged={step.onExecutorStateChanged}
        onIntentJobStateChanged={step.onIntentJobStateChanged}
      />
    );
  }

  if (phase.type === "failed") {
    return (
      <GenericFollowInstructionsDrawer {...step.errorDrawerProps} isOpen handleClose={step.leave} />
    );
  }

  return null;
}
