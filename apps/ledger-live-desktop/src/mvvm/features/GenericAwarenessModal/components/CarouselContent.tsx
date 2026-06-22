import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Slides, useSlidesContext } from "LLD/components/Slides";
import { Button, PageIndicator } from "@ledgerhq/lumen-ui-react";
import {
  hasAwarenessModalActionButton,
  resolveCarouselNavigationButtonLabel,
  type GenericAwarenessModalCarouselSlide,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { useThemedAwarenessModalImage } from "../hooks/useThemedAwarenessModalImage";
import { AwarenessModalClampedText, CAROUSEL_SLIDE_TEXT_LINE_LIMITS } from "./clampedText";

type CarouselContentSlideProps = Pick<
  GenericAwarenessModalCarouselSlide,
  "title" | "subtitle" | "imageUrlLight" | "imageUrlDark"
>;

function CarouselContentSlide({
  title,
  subtitle,
  imageUrlLight,
  imageUrlDark,
}: Readonly<CarouselContentSlideProps>) {
  const { imageUrl, showImage } = useThemedAwarenessModalImage({
    imageUrlLight,
    imageUrlDark,
  });

  return (
    <div className="flex size-full flex-col">
      <div className="pb-24 overflow-hidden w-full">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none h-[200px] w-full select-none rounded-xl object-cover"
            draggable={false}
            decoding="async"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-30 px-20">
        <div
          className="flex w-full min-w-0 animate-fade-in flex-col items-center text-center"
          style={{ pointerEvents: "none" }}
        >
          <div className="w-full min-w-0">
            <AwarenessModalClampedText
              text={title}
              maxLines={CAROUSEL_SLIDE_TEXT_LINE_LIMITS.title}
              className="mb-8 text-center heading-4-semi-bold text-base"
            />
            <AwarenessModalClampedText
              text={subtitle}
              maxLines={CAROUSEL_SLIDE_TEXT_LINE_LIMITS.subtitle}
              className="body-2 text-center text-muted"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export type CarouselContentProps = {
  slides: GenericAwarenessModalCarouselSlide[];
  onSlidePrimaryClick: (slide: GenericAwarenessModalCarouselSlide) => void;
  onSlideChange: (index: number) => void;
  onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  onClose: () => void;
};

function CarouselContentProgress() {
  const { currentIndex, totalSlides } = useSlidesContext();
  return (
    <div className="flex justify-center py-24">
      <PageIndicator currentPage={currentIndex + 1} totalPages={totalSlides} />
    </div>
  );
}

function CarouselContentFooter({
  slides,
  onSlidePrimaryClick,
  onContinueClick,
  onClose,
}: Readonly<{
  slides: GenericAwarenessModalCarouselSlide[];
  onSlidePrimaryClick: (slide: GenericAwarenessModalCarouselSlide) => void;
  onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const { currentIndex, totalSlides, goToNext } = useSlidesContext();
  const isLastSlide = currentIndex === totalSlides - 1;
  const currentSlide = slides[currentIndex];
  const navigationButtonLabel = resolveCarouselNavigationButtonLabel(
    currentSlide?.navigationButtonLabel ?? "",
    isLastSlide ? t("common.close") : t("common.continue"),
  );
  const showPrimaryButton = currentSlide
    ? hasAwarenessModalActionButton(currentSlide.primaryButtonLabel, currentSlide.primaryButtonLink)
    : false;

  const handleContinue = useCallback(() => {
    onContinueClick(currentIndex, isLastSlide);
    if (isLastSlide) {
      onClose();
    } else {
      goToNext();
    }
  }, [currentIndex, goToNext, isLastSlide, onClose, onContinueClick]);

  const handlePrimary = useCallback(() => {
    if (currentSlide) {
      onSlidePrimaryClick(currentSlide);
    }
  }, [currentSlide, onSlidePrimaryClick]);

  return (
    <div className="flex flex-col gap-16">
      {showPrimaryButton ? (
        <Button
          appearance="base"
          size="lg"
          isFull
          onClick={handlePrimary}
          data-testid="generic-awareness-modal-primary-button"
        >
          {currentSlide?.primaryButtonLabel}
        </Button>
      ) : null}
      <Button
        appearance="gray"
        size="lg"
        isFull
        onClick={handleContinue}
        data-testid="generic-awareness-modal-continue-button"
      >
        {navigationButtonLabel}
      </Button>
    </div>
  );
}

export default function CarouselContent({
  slides,
  onSlidePrimaryClick,
  onSlideChange,
  onContinueClick,
  onClose,
}: Readonly<CarouselContentProps>) {
  return (
    <Slides initialSlideIndex={0} onSlideChange={onSlideChange}>
      <Slides.Content>
        {slides.map((slide, index) => (
          <Slides.Content.Item key={`${slide.title}-carousel-slide-${index}`}>
            <CarouselContentSlide {...slide} />
          </Slides.Content.Item>
        ))}
      </Slides.Content>
      <Slides.ProgressIndicator>
        <CarouselContentProgress />
      </Slides.ProgressIndicator>
      <Slides.Footer>
        <CarouselContentFooter
          slides={slides}
          onSlidePrimaryClick={onSlidePrimaryClick}
          onContinueClick={onContinueClick}
          onClose={onClose}
        />
      </Slides.Footer>
    </Slides>
  );
}
