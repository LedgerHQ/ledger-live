import React, { useCallback, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import { LedgerSyncIntentStepLWM } from "../../deviceIntents/LedgerSyncIntentStepLWM";
import {
  type ActivationStepInput,
  useActivationDeviceIntentStepViewModel,
} from "./useActivationDeviceIntentStepViewModel";

export type ActivationDeviceIntentStep = Readonly<{
  /** `lwmLedgerSyncDie`: the entry opens the step in place instead of the process screen. */
  isEnabled: boolean;
  start: (input?: ActivationStepInput) => void;
  /** Rendered by the entry screen, outside any drawer that closes before `start`. */
  element: React.ReactElement | null;
}>;

function MemberCredentialsInitializer() {
  useInitMemberCredentials();
  return null;
}

type ActivationDeviceIntentStepHostProps = Readonly<{
  input: ActivationStepInput;
  onClose: () => void;
}>;

function ActivationDeviceIntentStepHost({ input, onClose }: ActivationDeviceIntentStepHostProps) {
  const step = useActivationDeviceIntentStepViewModel({ input, onClose });
  return (
    <>
      {step.phase.type === "pending" ? <MemberCredentialsInitializer /> : null}
      <LedgerSyncIntentStepLWM step={step} />
    </>
  );
}

/** The activation device step on DIE, opened over the entry screen. */
export function useActivationDeviceIntentStep(): ActivationDeviceIntentStep {
  const isEnabled = useFeature("lwmLedgerSyncDie")?.enabled === true;
  const [input, setInput] = useState<ActivationStepInput | null>(null);
  const start = useCallback((nextInput: ActivationStepInput = {}) => setInput(nextInput), []);
  const close = useCallback(() => setInput(null), []);

  return {
    isEnabled,
    start,
    element: input ? <ActivationDeviceIntentStepHost input={input} onClose={close} /> : null,
  };
}
