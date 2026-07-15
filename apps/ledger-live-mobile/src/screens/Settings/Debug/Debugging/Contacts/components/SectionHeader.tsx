import React from "react";
import { Box, Text, Divider } from "@ledgerhq/lumen-ui-rnative";
import { SectionHeaderProps } from "../types";

export const SectionHeader = ({ title }: SectionHeaderProps) => (
  <Box lx={{ marginBottom: "s16" }}>
    <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
      {title}
    </Text>
    <Divider />
  </Box>
);
