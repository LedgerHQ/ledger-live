import React, { useCallback } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { LAZY_ONBOARDING_TOUR_LAST_SLIDE_INDEX } from "./const";

type LazyOnboardingTourFooterProps = Readonly<{
  onContinue: (step: number) => void;
  onBuy: (step: number) => void;
  onDone: () => void;
}>;

export function LazyOnboardingTourFooter({
  onContinue,
  onBuy,
  onDone,
}: LazyOnboardingTourFooterProps) {
  const { t } = useTranslation();
  const { currentIndex, goToNext } = useSlidesContext();
  const isLastSlide = currentIndex >= LAZY_ONBOARDING_TOUR_LAST_SLIDE_INDEX;

  const handlePrimaryPress = useCallback(() => {
    if (isLastSlide) {
      onDone();
      return;
    }

    onContinue(currentIndex);
    goToNext();
  }, [currentIndex, goToNext, isLastSlide, onContinue, onDone]);

  const handleSecondaryPress = useCallback(() => {
    onBuy(currentIndex);
  }, [currentIndex, onBuy]);

  const primaryLabel = isLastSlide ? t("common.done") : t("common.continue");
  const secondaryLabel = t("lazyOnboardingTour.buyCta");

  return (
    <Box lx={{ width: "full" }}>
      <Button
        appearance="base"
        size="lg"
        onPress={handlePrimaryPress}
        testID="lazy-onboarding-tour-primary-button"
      >
        {primaryLabel}
      </Button>
      <Button
        appearance="gray"
        size="lg"
        onPress={handleSecondaryPress}
        lx={{ marginTop: "s16" }}
        testID="lazy-onboarding-tour-secondary-button"
      >
        {secondaryLabel}
      </Button>
    </Box>
  );
}
