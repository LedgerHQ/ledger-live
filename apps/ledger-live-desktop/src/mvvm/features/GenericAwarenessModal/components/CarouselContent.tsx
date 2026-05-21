import React, { useCallback } from "react";
import { Slides, useSlidesContext } from "LLD/components/Slides";
import { Button, PageIndicator } from "@ledgerhq/lumen-ui-react";

export type AwarenessCarouselSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
};

type CarouselContentSlideProps = Pick<AwarenessCarouselSlide, "title" | "subtitle" | "imageUrl">;

function CarouselContentSlide({ title, subtitle, imageUrl }: Readonly<CarouselContentSlideProps>) {
  const showImage = imageUrl != null && imageUrl.length > 0;

  return (
    <div className="flex size-full flex-col">
      <div className="py-24 overflow-hidden w-full">
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
      <div className="flex flex-1 flex-col items-center px-20 gap-30">
        <div
          className="flex animate-fade-in flex-col items-center text-center"
          style={{ pointerEvents: "none" }}
        >
          <div>
            <h3 className="m-0 mb-8 heading-4-semi-bold text-base">{title}</h3>
            <p className="m-0 body-2 text-muted">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export type CarouselContentProps = {
  slides: AwarenessCarouselSlide[];
  onSlidePrimaryClick: (slide: AwarenessCarouselSlide) => void;
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
}: Readonly<{
  slides: AwarenessCarouselSlide[];
  onSlidePrimaryClick: (slide: AwarenessCarouselSlide) => void;
}>) {
  const { currentIndex, totalSlides, goToNext, goToSlide } = useSlidesContext();
  const isLastSlide = currentIndex === totalSlides - 1;
  const currentSlide = slides[currentIndex];

  const handleContinue = useCallback(() => {
    if (isLastSlide) {
      goToSlide(0);
    } else {
      goToNext();
    }
  }, [isLastSlide, goToNext, goToSlide]);

  const handlePrimary = useCallback(() => {
    if (currentSlide) {
      onSlidePrimaryClick(currentSlide);
    }
  }, [currentSlide, onSlidePrimaryClick]);

  return (
    <div className="flex flex-col gap-16">
      <Button
        appearance="base"
        size="lg"
        isFull
        onClick={handlePrimary}
        data-testid="generic-awareness-modal-primary-button"
      >
        {currentSlide?.primaryButtonLabel}
      </Button>
      <Button
        appearance="gray"
        size="lg"
        isFull
        onClick={handleContinue}
        data-testid="generic-awareness-modal-continue-button"
      >
        {isLastSlide ? "Go to first slide" : "Continue"}
      </Button>
    </div>
  );
}

export default function CarouselContent({
  slides,
  onSlidePrimaryClick,
}: Readonly<CarouselContentProps>) {
  return (
    <Slides initialSlideIndex={0}>
      <Slides.Content>
        {slides.map(slide => (
          <Slides.Content.Item key={slide.id}>
            <CarouselContentSlide {...slide} />
          </Slides.Content.Item>
        ))}
      </Slides.Content>
      <Slides.ProgressIndicator>
        <CarouselContentProgress />
      </Slides.ProgressIndicator>
      <Slides.Footer>
        <CarouselContentFooter slides={slides} onSlidePrimaryClick={onSlidePrimaryClick} />
      </Slides.Footer>
    </Slides>
  );
}
