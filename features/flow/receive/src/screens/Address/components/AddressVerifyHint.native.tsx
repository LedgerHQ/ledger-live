import React, { useEffect } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import type { AddressVerifyHint as AddressVerifyHintProps } from "../../../types";

export const HINT_ENTER_MS = 220;

export function AddressVerifyHint({ open, onGotIt, onShown }: AddressVerifyHintProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (open) onShown?.();
  }, [open, onShown]);

  if (!open) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(HINT_ENTER_MS)}
      testID="receive-address-verify-hint"
      style={{ position: "absolute", right: 16, bottom: "100%", width: 256, zIndex: 2 }}
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
          {t("receiveAddress.verifyHint.message")}
        </Text>
        <Box lx={{ alignItems: "flex-end" }}>
          <Button size="sm" onPress={onGotIt}>
            {t("receiveAddress.verifyHint.gotIt")}
          </Button>
        </Box>
      </Box>
    </Animated.View>
  );
}
