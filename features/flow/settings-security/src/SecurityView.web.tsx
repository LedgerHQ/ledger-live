import React from "react";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import { SecurityRowIcon } from "./components/SecurityRowIcon/SecurityRowIcon";
import { SecurityStateEvents } from "./components/SecurityStateEvents/SecurityStateEvents";
import type { SecurityViewProps } from "./Security.types";

export function SecurityView({ rows, stateEvents, testID }: SecurityViewProps) {
  return (
    <SettingsSection testID={testID}>
      {rows.map(({ id, ...row }) => (
        <SettingsRow key={id} {...row} icon={<SecurityRowIcon id={id} />} />
      ))}
      <SecurityStateEvents events={stateEvents} />
    </SettingsSection>
  );
}
