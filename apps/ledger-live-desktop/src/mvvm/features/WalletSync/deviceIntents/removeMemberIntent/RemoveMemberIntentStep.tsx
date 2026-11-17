import React from "react";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { LedgerSyncIntentRun } from "../LedgerSyncIntentRun";
import { useRemoveMemberIntentStep } from "./useRemoveMemberIntentStep";

type RemoveMemberIntentStepProps = Readonly<{
  member: TrustchainMember | null;
  onError: (error: Error) => void;
}>;

export function RemoveMemberIntentStep({ member, onError }: RemoveMemberIntentStepProps) {
  const { createRunIntent, ...run } = useRemoveMemberIntentStep(member, onError);

  if (!createRunIntent) return null;

  return <LedgerSyncIntentRun createRunIntent={createRunIntent} {...run} />;
}
