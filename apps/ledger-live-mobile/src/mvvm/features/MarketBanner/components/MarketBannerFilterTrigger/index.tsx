import React from "react";
import { Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";

interface MarketBannerFilterTriggerProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const CHEVRON_SIZE = 16;

export const MarketBannerFilterTrigger = ({
  label,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: MarketBannerFilterTriggerProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    testID={testID}
    hitSlop={8}
    style={{ marginLeft: "auto" }}
  >
    {({ pressed }) => {
      const color = pressed ? "mutedPressed" : "muted";
      return (
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
          <Text typography="body2SemiBold" lx={{ color }}>
            {label}
          </Text>
          <ChevronDown size={CHEVRON_SIZE} color={color} />
        </Box>
      );
    }}
  </Pressable>
);
