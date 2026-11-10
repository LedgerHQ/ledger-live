import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import type { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { LedgerSyncIntentStep } from "../LedgerSyncIntentStep";
import { useAddMemberIntentStep } from "./useAddMemberIntentStep";

type AddMemberIntentStepProps = Readonly<{
  sourcePage?: AnalyticsPage;
}>;

export function AddMemberIntentStep({ sourcePage }: AddMemberIntentStepProps) {
  const { createRunIntent, ...step } = useAddMemberIntentStep(sourcePage);

  if (!createRunIntent) return <Spinner size={32} />;

  return <LedgerSyncIntentStep createRunIntent={createRunIntent} {...step} />;
}
