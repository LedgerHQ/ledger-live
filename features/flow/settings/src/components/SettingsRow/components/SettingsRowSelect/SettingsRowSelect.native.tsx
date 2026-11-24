import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { getSelectedOptionLabel } from "../../../../logic/settingsRowTrailing";
import type { SettingsRowSelectProps } from "./SettingsRowSelect.types";

/** Shows the current value; the picker comes with the mobile Settings screens. */
export function SettingsRowSelect({ trailing }: SettingsRowSelectProps) {
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {getSelectedOptionLabel(trailing.options, trailing.value)}
      </Text>
      <ChevronDown size={20} color="muted" />
    </Box>
  );
}
