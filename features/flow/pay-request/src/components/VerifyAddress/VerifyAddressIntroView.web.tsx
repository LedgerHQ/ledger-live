import React from "react";
import { QrCodeScanner } from "@ledgerhq/lumen-ui-react/symbols";
import { VerifyAddressDialog } from "./VerifyAddressDialog.web";
import type { VerifyAddressIntroViewProps } from "../../types";

export function VerifyAddressIntroView({
  isOpen,
  title,
  description,
  verifyCta,
  onVerify,
  onClose,
}: VerifyAddressIntroViewProps) {
  return (
    <VerifyAddressDialog
      isOpen={isOpen}
      onClose={onClose}
      contentTestId="pay-card-verify-address-intro"
      icon={QrCodeScanner}
      title={title}
      description={description}
      ctaLabel={verifyCta}
      onCta={onVerify}
      ctaTestId="pay-card-verify-address-verify-cta"
    />
  );
}
