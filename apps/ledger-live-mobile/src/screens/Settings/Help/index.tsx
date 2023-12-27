import React from "react";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { TrackScreen } from "~/analytics";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import ExportLogsRow from "./ExportLogsRow";
import HardResetRow from "./HardResetRow";
import ConfigureDeviceRow from "./ConfigureDeviceRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";

export default function HelpSettings() {
  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Help" />
      <LedgerSupportRow />
      {newDeviceSelectionFeatureFlag?.enabled ? null : <ConfigureDeviceRow />}
      <ExportLogsRow />
      <ClearCacheRow />
      <HardResetRow />
    </SettingsNavigationScrollView>
  );
}
