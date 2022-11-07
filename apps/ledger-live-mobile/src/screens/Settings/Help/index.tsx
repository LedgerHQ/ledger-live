import React from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { TrackScreen } from "../../../analytics";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import ExportLogsRow from "./ExportLogsRow";
import HardResetRow from "./HardResetRow";
import ConfigureDeviceRow from "./ConfigureDeviceRow";
import ResetThirdPartyDataRow from "./ResetThirdPartyDataRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import { swapKYCSelector } from "../../../reducers/settings";

export default function HelpSettings() {
  const swapKYC = useSelector(swapKYCSelector);
  const hasSwapLoginOrKYCInfo = Object.keys(swapKYC).length !== 0;

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Help" />
      <LedgerSupportRow />
      {newDeviceSelectionFeatureFlag?.enabled ? null : <ConfigureDeviceRow />}
      <ExportLogsRow />
      <ClearCacheRow />
      {hasSwapLoginOrKYCInfo && <ResetThirdPartyDataRow />}
      <HardResetRow />
    </SettingsNavigationScrollView>
  );
}
