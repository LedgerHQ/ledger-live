import React from "react";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { SettingsDeveloperViewProps } from "./SettingsDeveloper.types";

export function SettingsDeveloperView({ rows, testID }: SettingsDeveloperViewProps) {
  return (
    <SettingsSection testID={testID}>
      {rows.map(({ id, ...row }) => (
        <SettingsRow key={id} {...row} />
      ))}
    </SettingsSection>
  );
}
