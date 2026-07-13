import React from "react";
import { Box, Text, Switch, Tag } from "@ledgerhq/lumen-ui-rnative";
import { FeatureParamRowProps } from "../types";

export const FeatureParamRow = ({
  label,
  isFeatureEnabled,
  value,
  onToggle,
  testID,
}: FeatureParamRowProps) => (
  <Box
    lx={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: "s16",
      paddingHorizontal: "s12",
      opacity: isFeatureEnabled ? 1 : 0.5,
    }}
  >
    <Box lx={{ flexDirection: "row", alignItems: "center", columnGap: "s12" }}>
      <Text typography="body2" lx={{ color: "base" }}>
        {label}
      </Text>
      {value && <Tag appearance="success" size="sm" label="ON" />}
    </Box>
    <Switch
      testID={testID}
      checked={value}
      onCheckedChange={onToggle}
      disabled={!isFeatureEnabled}
    />
  </Box>
);
