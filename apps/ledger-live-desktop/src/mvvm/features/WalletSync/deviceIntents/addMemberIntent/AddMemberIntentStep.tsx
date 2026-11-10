import React from "react";
import { InfiniteLoader } from "@ledgerhq/react-ui";
import type { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { LedgerSyncIntentStep } from "../LedgerSyncIntentStep";
import { useAddMemberIntentStep } from "./useAddMemberIntentStep";

type AddMemberIntentStepProps = Readonly<{
  sourcePage?: AnalyticsPage;
}>;

export function AddMemberIntentStep({ sourcePage }: AddMemberIntentStepProps) {
  const { createRunIntent, ...step } = useAddMemberIntentStep(sourcePage);

  if (!createRunIntent) return <InfiniteLoader size={50} />;

  return <LedgerSyncIntentStep createRunIntent={createRunIntent} {...step} />;
}
