import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { VerifyAddressSheet } from "./VerifyAddressSheet.native";
import type { VerifyAddressSuccessViewProps } from "../../types";

export function VerifyAddressSuccessView({
  isOpen,
  title,
  nextStepsLabel,
  nextSteps,
  gotItCta,
  onGotIt,
  onClose,
  bottomInset,
}: VerifyAddressSuccessViewProps) {
  return (
    <VerifyAddressSheet
      isOpen={isOpen}
      onClose={onClose}
      sheetTestId="pay-card-verify-address-success-sheet"
      contentTestId="pay-card-verify-address-success"
      bottomInset={bottomInset}
      icon={ShieldLock}
      title={title}
      ctaLabel={gotItCta}
      onCta={onGotIt}
      ctaTestId="pay-card-verify-address-got-it-cta"
    >
      <Box lx={{ backgroundColor: "surface", borderRadius: "md", gap: "s16", padding: "s16" }}>
        <Text typography="body4" lx={{ color: "muted" }}>
          {nextStepsLabel}
        </Text>
        {nextSteps.map(step => (
          <Box key={step.index} lx={{ alignItems: "flex-start", flexDirection: "row", gap: "s12" }}>
            <Spot appearance="number" number={step.index} size={32} />
            <Text typography="body3" lx={{ color: "base", flexShrink: 1 }}>
              {step.label}
            </Text>
          </Box>
        ))}
      </Box>
    </VerifyAddressSheet>
  );
}
