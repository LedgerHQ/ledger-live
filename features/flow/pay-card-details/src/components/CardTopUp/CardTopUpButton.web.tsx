import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import type { CardTopUpButtonProps } from "./types";

export function CardTopUpButton({ onTopUp }: CardTopUpButtonProps) {
  const { t } = useTranslation();
  const label = t("payTab.card.topUp");

  if (!onTopUp) {
    return null;
  }

  return (
    <Button appearance="base" size="lg" isFull onClick={onTopUp} aria-label={label}>
      {label}
    </Button>
  );
}
