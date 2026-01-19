import React from "react";
import LedgerSyncEntryPoint from "LLM/features/LedgerSyncEntryPoint";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

export default function AccountsListHeaderRight() {
  const lwmLedgerSyncOptimisation = useFeature("lwmLedgerSyncOptimisation");

  if (lwmLedgerSyncOptimisation?.enabled) {
    return null;
  }

  return <LedgerSyncEntryPoint entryPoint={EntryPoint.accounts} page="Accounts" />;
}
