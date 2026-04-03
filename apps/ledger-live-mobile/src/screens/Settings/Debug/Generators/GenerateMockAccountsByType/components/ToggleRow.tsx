import React from "react";
import { Switch, Box, Text } from "@ledgerhq/lumen-ui-rnative";

export type ToggleRowProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function ToggleRow({ label, description, value, onValueChange }: Readonly<ToggleRowProps>) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: "s16",
        paddingVertical: "s14",
        borderBottomWidth: "s1",
        borderBottomColor: "mutedSubtle",
      }}
    >
      <Box lx={{ flex: 1, marginRight: "s12" }}>
        <Text typography="body1SemiBold" lx={{ color: "base" }}>
          {label}
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {description}
        </Text>
      </Box>
      <Switch checked={value} onCheckedChange={onValueChange} />
    </Box>
  );
}
