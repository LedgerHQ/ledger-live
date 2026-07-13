import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { FeatureFlagPreviewProps } from "../types";
import { SectionHeader } from "./SectionHeader";

export const FeatureFlagPreview = ({ summary }: FeatureFlagPreviewProps) => (
  <>
    <SectionHeader title="FEATURE FLAG PREVIEW" />
    <Box
      lx={{
        backgroundColor: "surface",
        borderRadius: "md",
        padding: "s16",
      }}
    >
      <Text typography="body3" lx={{ color: "base" }}>
        {summary}
      </Text>
    </Box>
  </>
);
