import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { LedgerSyncIntentStep } from "../LedgerSyncIntentStep";
import { useRemoveMemberIntentStep } from "./useRemoveMemberIntentStep";

type RemoveMemberIntentStepProps = Readonly<{
  member: TrustchainMember | null;
}>;

export function RemoveMemberIntentStep({ member }: RemoveMemberIntentStepProps) {
  const { createRunIntent, ...step } = useRemoveMemberIntentStep(member);

  if (!createRunIntent) return <Spinner size={32} />;

  return <LedgerSyncIntentStep createRunIntent={createRunIntent} {...step} />;
}
