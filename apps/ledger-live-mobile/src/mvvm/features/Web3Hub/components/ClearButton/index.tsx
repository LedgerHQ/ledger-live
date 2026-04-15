import React from "react";
import { Box, Icons } from "@ledgerhq/native-ui";
import { BorderlessButton } from "react-native-gesture-handler";

type Props = {
  onPress: () => void;
};

export default function ClearButton({ onPress }: Props) {
  return (
    <BorderlessButton onPress={onPress} activeOpacity={0.5} borderless={false}>
      <Box
        p={4}
        accessible
        accessibilityRole="button"
        accessibilityLabel="clear search"
        aria-label="clear search"
      >
        <Icons.Close size="XS" />
      </Box>
    </BorderlessButton>
  );
}
