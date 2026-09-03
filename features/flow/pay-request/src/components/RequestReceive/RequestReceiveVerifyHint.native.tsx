import React, { useEffect } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { RequestReceiveVerifyHint as RequestReceiveVerifyHintProps } from "../../types";

export const HINT_ENTER_MS = 220;

export function RequestReceiveVerifyHint({
  open,
  message,
  gotItLabel,
  onGotIt,
  onShown,
}: RequestReceiveVerifyHintProps) {
  useEffect(() => {
    if (open) onShown?.();
  }, [open, onShown]);

  if (!open) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(HINT_ENTER_MS)}
      testID="pay-request-receive-verify-hint"
      style={{ alignSelf: "flex-end", maxWidth: 256, width: 256, zIndex: 2 }}
    >
      <Box
        lx={{
          gap: "s12",
          backgroundColor: "surface",
          borderRadius: "md",
          padding: "s16",
          marginBottom: "s8",
        }}
      >
        <Text typography="body2" lx={{ color: "base" }}>
          {message}
        </Text>
        <Box lx={{ alignItems: "flex-end" }}>
          <Button size="sm" onPress={onGotIt}>
            {gotItLabel}
          </Button>
        </Box>
      </Box>
    </Animated.View>
  );
}
