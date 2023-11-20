import React from "react";
<<<<<<< HEAD
<<<<<<< HEAD
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
=======
import { useFeature } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
=======
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
>>>>>>> 5795ae130c (fix: snackcase for folder name)
import { TrackScreen } from "../../../analytics";
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
