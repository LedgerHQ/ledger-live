import React from "react";
import { GenericProps, GenericStatusDisplay } from "./GenericStatusDisplay";
import { useFeature } from "@features/platform-feature-flags";
import { Complete } from "./Complete";
export const Success = (props: GenericProps) => {
  const lwdLedgerSyncOptimisation = useFeature("lwdLedgerSyncOptimisation");
  if (lwdLedgerSyncOptimisation?.enabled) {
    return <Complete {...props} />;
  }
  return <GenericStatusDisplay {...props} type="success" />;
};
