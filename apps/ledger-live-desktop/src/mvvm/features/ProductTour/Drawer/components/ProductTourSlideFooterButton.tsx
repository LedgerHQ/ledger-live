import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useSlidesContext } from "LLD/components/Slides";

export function ProductTourSlideFooterButton() {
  const { t } = useTranslation();
  const { currentIndex, totalSlides, goToNext } = useSlidesContext();
  const isLastSlide = currentIndex === totalSlides - 1;

  return (
    <div className="px-20">
      <Button
        appearance="base"
        size="lg"
        isFull
        type="button"
        disabled={isLastSlide}
        onClick={() => goToNext()}
        className={isLastSlide ? "pointer-events-none invisible" : undefined}
        aria-hidden={isLastSlide}
      >
        {t("productTour.cta.continue")}
      </Button>
    </div>
  );
}
