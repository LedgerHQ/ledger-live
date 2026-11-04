import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";

type CardTopUpButtonProps = Readonly<{
  onTopUp?: () => void;
}>;

export function CardTopUpButton({ onTopUp }: CardTopUpButtonProps) {
  const { t } = useTranslation();
  const label = t("payTab.card.topUp");

  if (!onTopUp) {
    return null;
  }

  return (
    <Button appearance="base" size="md" isFull onPress={onTopUp} accessibilityLabel={label}>
      {label}
    </Button>
  );
}
