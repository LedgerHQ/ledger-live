import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { CardScreenViewModel } from "./useCardScreenViewModel";

type CardScreenViewProps = CardScreenViewModel;

export function CardScreenView({
  description,
  isPreAuthLoading,
  onPreAuthPress,
  preAuthButtonLabel,
  preAuthResult,
  title,
}: CardScreenViewProps) {
  return (
    <Box style={{ flex: 1 }}>
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}>
        <Box
          lx={{
            backgroundColor: "muted",
            borderRadius: "md",
            padding: "s16",
            flexDirection: "column",
            gap: "s4",
          }}
        >
          <Text typography="body2SemiBold">{title}</Text>
          <Text typography="body3">{description}</Text>
          <Button
            appearance="base"
            size="lg"
            onPress={onPreAuthPress}
            disabled={isPreAuthLoading}
            accessibilityLabel={preAuthButtonLabel}
          >
            {preAuthButtonLabel}
          </Button>
          {preAuthResult ? <Text typography="body3">{preAuthResult}</Text> : null}
        </Box>
      </Box>
    </Box>
  );
}
