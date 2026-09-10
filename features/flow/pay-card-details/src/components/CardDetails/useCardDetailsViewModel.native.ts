import { useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { CardDetailsProps, CardDetailsViewProps } from "../../types";

export function useCardDetailsViewModel({ cardVisual }: CardDetailsProps): CardDetailsViewProps {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return {
    cardVisual,
    placeholderLabel: t("payTab.card.placeholder"),
    detailsLabel: t("payTab.card.details"),
    isSheetOpen,
    onDetailsPress: () => setIsSheetOpen(true),
    onSheetClose: () => setIsSheetOpen(false),
  };
}
