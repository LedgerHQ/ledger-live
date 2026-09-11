import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useSlidesContext } from "LLD/components/Slides";
import type { ReleaseTourSlide } from "./types";

interface ReleaseTourFooterButtonProps {
  readonly slides: readonly ReleaseTourSlide[];
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onComplete: () => void;
}

export function ReleaseTourFooterButton({
  slides,
  onContinueClick,
  onComplete,
}: ReleaseTourFooterButtonProps) {
  const { displayedIndex, totalSlides, goToNext } = useSlidesContext();
  const { t } = useTranslation();

  const isLastSlide = displayedIndex === totalSlides - 1;
  const ctaKey = slides[displayedIndex]?.ctaKey ?? slides[0].ctaKey;

  const handleClick = () => {
    onContinueClick(displayedIndex, isLastSlide);

    if (isLastSlide) {
      onComplete();
      return;
    }

    goToNext();
  };

  return (
    <div className="flex flex-col gap-16">
      <Button appearance="base" size="lg" isFull onClick={handleClick}>
        {t(ctaKey)}
      </Button>
    </div>
  );
}
