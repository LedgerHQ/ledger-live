import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useSlidesContext } from "LLD/components/Slides";

interface SlideFooterButtonProps {
  readonly onClose: () => void;
}

export function SlideFooterButton({ onClose }: SlideFooterButtonProps) {
  const { currentIndex, totalSlides, goToNext } = useSlidesContext();
  const { t } = useTranslation();

  const isLastSlide = currentIndex === totalSlides - 1;

  return (
    <div className="px-20">
      <Button appearance="base" size="lg" isFull onClick={isLastSlide ? onClose : goToNext}>
        {isLastSlide ? t("walletV4Tour.cta.explore") : t("walletV4Tour.cta.continue")}
      </Button>
    </div>
  );
}
