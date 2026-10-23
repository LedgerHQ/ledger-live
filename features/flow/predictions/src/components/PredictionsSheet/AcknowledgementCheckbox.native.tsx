import React from "react";
import { Pressable } from "react-native";
import { Box, Checkbox, Text } from "@ledgerhq/lumen-ui-rnative";

type Props = Readonly<{
  label: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}>;

// Lumen's Checkbox label is centred and body2; the design needs it top-aligned and body3.
export function AcknowledgementCheckbox({ label, isChecked, onChange }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      onPress={() => onChange(!isChecked)}
    >
      <Box lx={{ flexDirection: "row", alignItems: "flex-start", gap: "s8" }}>
        <Box pointerEvents="none">
          <Checkbox checked={isChecked} />
        </Box>
        <Text typography="body3" lx={{ color: "base", flex: 1 }}>
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}
