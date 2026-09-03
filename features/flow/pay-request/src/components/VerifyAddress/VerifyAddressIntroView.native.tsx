import React from "react";
import { QrCodeScanner } from "@ledgerhq/lumen-ui-rnative/symbols";
import { VerifyAddressSheet } from "./VerifyAddressSheet.native";
import type { VerifyAddressIntroViewProps } from "../../types";

export function VerifyAddressIntroView({
  isOpen,
  title,
  description,
  verifyCta,
  onVerify,
  onClose,
  bottomInset,
}: VerifyAddressIntroViewProps) {
  return (
    <VerifyAddressSheet
      isOpen={isOpen}
      onClose={onClose}
      sheetTestId="pay-card-verify-address-intro-sheet"
      contentTestId="pay-card-verify-address-intro"
      icon={QrCodeScanner}
      title={title}
      description={description}
      ctaLabel={verifyCta}
      onCta={onVerify}
      ctaTestId="pay-card-verify-address-verify-cta"
      bottomInset={bottomInset}
    />
  );
}
