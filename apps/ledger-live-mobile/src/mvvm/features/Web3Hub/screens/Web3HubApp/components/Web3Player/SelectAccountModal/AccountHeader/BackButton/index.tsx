import React from "react";
import { BorderlessButton } from "react-native-gesture-handler";
import { Box, Icons } from "@ledgerhq/native-ui";

export default function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <BorderlessButton onPress={onPress} activeOpacity={0.5} borderless={false}>
      <Box
        pr={3}
        height={32}
        justifyContent={"center"}
        accessible
        accessibilityRole="button"
        aria-label="back"
      >
        <Icons.ArrowLeft />
      </Box>
    </BorderlessButton>
  );
}
