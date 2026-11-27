import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { SettingsRow } from "@features/flow-settings";
import { PrivacyRowIcon } from "./components/PrivacyRowIcon/PrivacyRowIcon";
import { PrivacyStateEvents } from "./components/PrivacyStateEvents/PrivacyStateEvents";
import type { PrivacyViewProps } from "./Privacy.types";

export function PrivacyView({ rows, stateEvents, testID }: PrivacyViewProps) {
  return (
    <Box lx={{ gap: "s20", paddingTop: "s16" }} testID={testID}>
      {rows.map(({ id, ...row }) => (
        <SettingsRow key={id} {...row} icon={<PrivacyRowIcon id={id} />} />
      ))}
      <PrivacyStateEvents events={stateEvents} />
    </Box>
  );
}
