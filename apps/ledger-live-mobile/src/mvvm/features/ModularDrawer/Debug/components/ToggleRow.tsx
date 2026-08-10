import React from "react";
import { Box, Switch, Text } from "@ledgerhq/lumen-ui-rnative";

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

export const ToggleRow = ({ label, value, onChange, description }: ToggleRowProps) => (
  <Box
    lx={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: "s4",
    }}
  >
    <Box lx={{ flex: 1, marginRight: "s12" }}>
      <Text typography="body2" lx={{ color: "base" }}>
        {label}
      </Text>
      {description && (
        <Text typography="body3" lx={{ color: "muted", marginTop: "s2" }}>
          {description}
        </Text>
      )}
    </Box>
    <Switch checked={value} onCheckedChange={onChange} />
  </Box>
);
