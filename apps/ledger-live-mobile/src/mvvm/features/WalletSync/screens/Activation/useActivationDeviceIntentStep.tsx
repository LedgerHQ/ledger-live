import React, { useCallback, useEffect, useRef, useState } from "react";
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

type ActivationDeviceIntentStepOptions = Readonly<{
  /** The step closed without an activation: cancelled, or an error dismissed. */
  onCancel?: () => void;
}>;

function MemberCredentialsInitializer() {
  useInitMemberCredentials();
  return null;
}

type ActivationDeviceIntentStepHostProps = Readonly<{
  input: ActivationStepInput;
  onClose: () => void;
  onActivated: () => void;
}>;

function ActivationDeviceIntentStepHost({
  input,
  onClose,
  onActivated,
}: ActivationDeviceIntentStepHostProps) {
  const step = useActivationDeviceIntentStepViewModel({ input, onClose, onActivated });
  return (
    <>
      {step.phase.type === "pending" ? <MemberCredentialsInitializer /> : null}
      <LedgerSyncIntentStepLWM step={step} />
    </>
  );
}

/** The activation device step on DIE, opened over the entry screen. */
export function useActivationDeviceIntentStep({
  onCancel,
}: ActivationDeviceIntentStepOptions = {}): ActivationDeviceIntentStep {
  const isEnabled = useFeature("lwmLedgerSyncDie")?.enabled === true;
  const [input, setInput] = useState<ActivationStepInput | null>(null);
  const activatedRef = useRef(false);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  const start = useCallback((nextInput: ActivationStepInput = {}) => {
    activatedRef.current = false;
    setInput(nextInput);
  }, []);
  const close = useCallback(() => {
    if (!activatedRef.current) onCancelRef.current?.();
    setInput(null);
  }, []);
  const onActivated = useCallback(() => {
    activatedRef.current = true;
  }, []);

  return {
    isEnabled,
    start,
    element: input ? (
      <ActivationDeviceIntentStepHost input={input} onClose={close} onActivated={onActivated} />
    ) : null,
  };
}
