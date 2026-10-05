import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import ExportLogsRow from "./ExportLogsRow";
import HardResetRow from "./HardResetRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";

export default function HelpSettings() {
  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Help" />
      <LedgerSupportRow />
      <ExportLogsRow />
      <ClearCacheRow />
      <HardResetRow />
    </SettingsNavigationScrollView>
  );
}
