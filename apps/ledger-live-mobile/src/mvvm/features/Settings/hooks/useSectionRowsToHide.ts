import { useMemo } from "react";
import type { SettingId } from "@features/flow-settings";
import { useFeature } from "@features/platform-feature-flags";
import { useSettingsRowsToHide } from "./useSettingsRowsToHide";

/** Rows a section hides: the device ones, and Ledger Sync while `llmWalletSync` is off. */
export function useSectionRowsToHide(): readonly SettingId[] {
  const deviceRows = useSettingsRowsToHide();
  const isLedgerSyncEnabled = useFeature("llmWalletSync")?.enabled ?? false;

  return useMemo(
    () => (isLedgerSyncEnabled ? deviceRows : [...deviceRows, "ledgerSync"]),
    [deviceRows, isLedgerSyncEnabled],
  );
}
