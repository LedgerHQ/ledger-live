import React from "react";
import type { KeyRingMember } from "@features/platform-key-ring";
import { LedgerSyncIntentRun } from "../LedgerSyncIntentRun";
import { useRemoveMemberIntentStep } from "./useRemoveMemberIntentStep";

type RemoveMemberIntentStepProps = Readonly<{
  member: KeyRingMember | null;
  onError: (error: Error) => void;
}>;

export function RemoveMemberIntentStep({ member, onError }: RemoveMemberIntentStepProps) {
  const { createRunIntent, ...run } = useRemoveMemberIntentStep(member, onError);

  if (!createRunIntent) return null;

  return <LedgerSyncIntentRun createRunIntent={createRunIntent} {...run} />;
}
