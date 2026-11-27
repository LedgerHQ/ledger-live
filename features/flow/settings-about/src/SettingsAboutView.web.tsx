import React from "react";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { SettingsAboutViewProps } from "./SettingsAbout.types";

export function SettingsAboutView({ rows, testID }: SettingsAboutViewProps) {
  return (
    <SettingsSection testID={testID}>
      {rows.map(({ id, ...row }) => (
        <SettingsRow key={id} {...row} />
      ))}
    </SettingsSection>
  );
}
