import React from "react";
import { Box, Icons } from "@ledgerhq/native-ui";
import { BorderlessButton } from "react-native-gesture-handler";

type Props = {
  onPress: () => void;
};

export default function BackButton({ onPress }: Props) {
  return (
    <BorderlessButton onPress={onPress} activeOpacity={0.5} borderless={false}>
      <Box p={4} accessible accessibilityRole="button" aria-label="back">
        <Icons.ArrowLeft />
      </Box>
    </BorderlessButton>
  );
}
