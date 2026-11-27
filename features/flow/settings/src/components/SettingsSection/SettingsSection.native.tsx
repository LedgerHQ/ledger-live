import React from "react";
import { Box, SectionHeader, SectionHeaderTitle } from "@ledgerhq/lumen-ui-rnative";
import type { SettingsSectionProps } from "./SettingsSection.types";

export function SettingsSection({ title, children, testID }: SettingsSectionProps) {
  return (
    <Box lx={{ gap: "s8" }} testID={testID}>
      {title ? (
        <SectionHeader>
          <SectionHeaderTitle>{title}</SectionHeaderTitle>
        </SectionHeader>
      ) : null}
      <Box lx={{ gap: "s4" }}>{children}</Box>
    </Box>
  );
}
