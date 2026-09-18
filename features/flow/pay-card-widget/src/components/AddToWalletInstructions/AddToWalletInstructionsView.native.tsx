import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { InstructionRow } from "./InstructionRow.native";
import type { AddToWalletInstructionsViewProps } from "./useAddToWalletInstructionsViewModel";

export function AddToWalletInstructionsView({
  title,
  steps,
  ctaLabel,
  ctaIcon,
  onPressCta,
}: AddToWalletInstructionsViewProps) {
  return (
    <Box testID="pay-card-add-to-wallet-instructions">
      <Box lx={{ marginHorizontal: "s8", marginBottom: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {title}
        </Text>
      </Box>
      <Box
        lx={{
          flexDirection: "column",
          marginHorizontal: "s4",
          marginBottom: "s8",
          borderRadius: "sm",
          backgroundColor: "surface",
        }}
      >
        {steps.map((label, index) => (
          <InstructionRow key={label} number={index + 1} label={label} />
        ))}
      </Box>
      <Box lx={{ margin: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          icon={ctaIcon}
          onPress={onPressCta}
          testID="pay-card-add-to-wallet-cta"
        >
          {ctaLabel}
        </Button>
      </Box>
    </Box>
  );
}
