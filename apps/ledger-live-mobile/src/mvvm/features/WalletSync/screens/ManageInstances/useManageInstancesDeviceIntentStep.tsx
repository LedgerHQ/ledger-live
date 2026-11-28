import React, { useCallback, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { LedgerSyncIntentStepLWM } from "../../deviceIntents/LedgerSyncIntentStepLWM";
import {
  type RemoveInstanceStepInput,
  useManageInstancesDeviceIntentStepViewModel,
} from "./useManageInstancesDeviceIntentStepViewModel";

export type ManageInstancesDeviceIntentStep = Readonly<{
  /** `lwmLedgerSyncDie`: the removal opens in place instead of the process screen. */
  isEnabled: boolean;
  start: (input: RemoveInstanceStepInput) => void;
  /** Rendered by the entry screen, outside any drawer that closes before `start`. */
  element: React.ReactElement | null;
}>;

type ManageInstancesDeviceIntentStepHostProps = Readonly<{
  input: RemoveInstanceStepInput;
  onClose: () => void;
}>;

function ManageInstancesDeviceIntentStepHost({
  input,
  onClose,
}: ManageInstancesDeviceIntentStepHostProps) {
  const step = useManageInstancesDeviceIntentStepViewModel({ input, onClose });
  return <LedgerSyncIntentStepLWM step={step} />;
}

/** The instance removal device step on DIE, opened over the entry screen. */
export function useManageInstancesDeviceIntentStep(): ManageInstancesDeviceIntentStep {
  const isEnabled = useFeature("lwmLedgerSyncDie")?.enabled === true;
  const [input, setInput] = useState<RemoveInstanceStepInput | null>(null);
  const close = useCallback(() => setInput(null), []);

  return {
    isEnabled,
    start: setInput,
    element: input ? <ManageInstancesDeviceIntentStepHost input={input} onClose={close} /> : null,
  };
}
