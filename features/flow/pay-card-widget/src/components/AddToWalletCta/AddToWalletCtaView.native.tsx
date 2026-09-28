import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import type { AddToWalletCtaViewProps } from "./useAddToWalletCtaViewModel";

export function AddToWalletCtaView({
  shouldRender,
  appearance,
  ctaLabel,
  ctaIcon,
  onPressCta,
}: AddToWalletCtaViewProps) {
  if (!shouldRender) {
    return null;
  }

  return (
    <Button
      appearance={appearance}
      size="lg"
      isFull
      icon={ctaIcon}
      onPress={onPressCta}
      accessibilityLabel={ctaLabel}
      testID="pay-card-add-to-wallet-cta-entry"
    >
      {ctaLabel}
    </Button>
  );
}
