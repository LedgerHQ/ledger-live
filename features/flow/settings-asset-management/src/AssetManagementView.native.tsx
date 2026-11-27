import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { AssetManagementViewProps } from "./AssetManagement.types";
import { AssetManagementRowIcon } from "./components/AssetManagementRowIcon/AssetManagementRowIcon";
import { HiddenTokensSheet } from "./components/HiddenTokensSheet/HiddenTokensSheet";

export function AssetManagementView({ rows, hiddenTokens, testID }: AssetManagementViewProps) {
  return (
    <>
      <TrackScreen category="Settings" name="Accounts" />
      <SettingsSection testID={testID}>
        {rows.map(({ id, ...row }) => (
          <SettingsRow key={id} {...row} icon={<AssetManagementRowIcon id={id} />} />
        ))}
      </SettingsSection>
      <HiddenTokensSheet sheet={hiddenTokens} />
    </>
  );
}
