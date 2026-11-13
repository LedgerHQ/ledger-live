import React from "react";
import type { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { LedgerSyncIntentRun } from "../LedgerSyncIntentRun";
import { useAddMemberIntentStep } from "./useAddMemberIntentStep";

type AddMemberIntentStepProps = Readonly<{
  sourcePage: AnalyticsPage;
  onError: (error: Error) => void;
}>;

export function AddMemberIntentStep({ sourcePage, onError }: AddMemberIntentStepProps) {
  const { createRunIntent, ...run } = useAddMemberIntentStep(sourcePage, onError);

  if (!createRunIntent) return null;

  return <LedgerSyncIntentRun createRunIntent={createRunIntent} {...run} />;
}
