import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useSlidesContext } from "LLD/components/Slides";
import { track } from "~/renderer/analytics/segment";
import { PAGE_TRACKING_WALLET_V4_TOUR } from "../const";

interface SlideFooterButtonProps {
  readonly onComplete: () => void;
}

export function SlideFooterButton({ onComplete }: SlideFooterButtonProps) {
  const { currentIndex, totalSlides, goToNext } = useSlidesContext();
  const { t } = useTranslation();

  const isLastSlide = currentIndex === totalSlides - 1;

  const handleClick = () => {
    if (isLastSlide) {
      track("button_clicked", {
        button: "Discover my new portfolio",
        page: PAGE_TRACKING_WALLET_V4_TOUR,
      });
      onComplete();
    } else {
      goToNext();
      track("button_clicked", {
        button: "Next",
        page: PAGE_TRACKING_WALLET_V4_TOUR,
        card: currentIndex + 1,
      });
    }
  };

  return (
    <div className="px-20">
      <Button appearance="base" size="lg" isFull onClick={handleClick}>
        {isLastSlide ? t("walletV4Tour.cta.explore") : t("walletV4Tour.cta.continue")}
      </Button>
    </div>
  );
}
