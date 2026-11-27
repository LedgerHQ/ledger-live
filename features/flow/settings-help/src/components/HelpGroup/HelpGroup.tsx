import React from "react";
import { SettingsSection } from "@features/flow-settings";
import type { HelpSlots } from "../../types";
import type { HelpGroupViewModel } from "../../useHelpViewModel";
import { HelpRow } from "../HelpRow/HelpRow";

export type HelpGroupProps = Readonly<{ group: HelpGroupViewModel; slots: HelpSlots }>;

export function HelpGroup({ group, slots }: HelpGroupProps) {
  return (
    <SettingsSection title={group.title} testID={`settings-help-group-${group.id}`}>
      {group.rows.map(row => (
        <HelpRow key={row.id} row={row} slots={slots} />
      ))}
    </SettingsSection>
  );
}
