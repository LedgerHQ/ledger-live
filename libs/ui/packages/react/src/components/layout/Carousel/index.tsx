import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Footer from "./Footer";
import { Props } from "./types";
import { ChevronArrow } from "./ChevronArrow";

const Embla = styled.div`
  overflow: hidden;
`;

const EmblaContainer = styled.div`
  display: flex;
`;

const EmblaSlide = styled.div`
  display: flex;
  flex: 0 0 100%;
  min-width: 0;
  > * {
    flex-basis: 100%;
  }
`;

const CarouselContainer = styled.div<Pick<Props, "variant">>`
  position: relative;

  --hover-transition: 0;
  &:hover {
    --hover-transition: 1;
  }
`;

/**
 * This component uses the https://github.com/davidjerleke/embla-carousel library.
 */
const Carousel = ({ children, variant = "default", autoPlay = 0, onNext, onPrev }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    autoPlay ? [Autoplay({ delay: autoPlay, ...AutoplayFlags })] : [],
  );

  const updateIndex = useCallback(() => {
    if (!emblaApi) return;

    const newIndex = emblaApi.selectedScrollSnap();
    setCurrentIndex(newIndex);
    emblaApi.scrollTo(newIndex);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Initial call to update carousel index
    updateIndex();

    const dragX = watchDragX(emblaApi);

    // When the selected scroll snap changes
    const handleAnySelect = debounce((mightBeASwipe: boolean) => {
      updateIndex();
      if (!mightBeASwipe || variant !== "default") return; // onNext/onPrev events are not supported for content-card variant ATM
      if (dragX.value > 0) return onPrev?.();
      if (dragX.value < 0) return onNext?.();
    }, 0); // all events are fired on the same tick so no need to wait past the next tick

    emblaApi.on("select", handleSelect);
    emblaApi.on("autoplay:select" as EmblaEventType, handleAutoPlaySelect);
    emblaApi.on("button:prev" as EmblaEventType, handlePrevButton);
    emblaApi.on("button:next" as EmblaEventType, handleNextButton);

    // When `reInit` is called or when window is resized
    emblaApi.on("reInit", updateIndex);

    return () => {
      dragX.clean();
      emblaApi.off("select", handleSelect);
      emblaApi.off("autoplay:select" as EmblaEventType, handleAutoPlaySelect);
      emblaApi.off("button:prev" as EmblaEventType, handlePrevButton);
      emblaApi.off("button:next" as EmblaEventType, handleNextButton);
      emblaApi.off("reInit", updateIndex);
    };

    function handleSelect() {
      handleAnySelect(true); // This could be a swipe action. As this runs first the debounce will override the value otherwise
    }
    function handleAutoPlaySelect() {
      handleAnySelect(false);
    }
    function handlePrevButton() {
      emblaApi?.scrollPrev();
      onPrev?.();
      handleAnySelect(false);
    }
    function handleNextButton() {
      emblaApi?.scrollNext();
      onNext?.();
      handleAnySelect(false);
    }
  }, [emblaApi, updateIndex, variant]);

  if (!children.length) return null;

  const handleGotoPrevSlide = () => emblaApi?.emit("button:prev" as EmblaEventType);
  const handleGotoNextSlide = () => emblaApi?.emit("button:next" as EmblaEventType);

  return (
    <div>
      <CarouselContainer variant={variant}>
        {variant === "default" && children.length > 1 && (
          <>
            <ChevronArrow
              data-testid="carousel-arrow-prev"
              direction="left"
              onClick={handleGotoPrevSlide}
            />
            <ChevronArrow
              data-testid="carousel-arrow-next"
              direction="right"
              onClick={handleGotoNextSlide}
            />
          </>
        )}

        <Embla ref={emblaRef}>
          <EmblaContainer>
            {children.map(child => (
              <EmblaSlide key={child.key}>{child}</EmblaSlide>
            ))}
          </EmblaContainer>
        </Embla>
      </CarouselContainer>

      <Footer
        children={children}
        variant={variant}
        emblaApi={emblaApi}
        currentIndex={currentIndex}
      />
    </div>
  );
};

export default Carousel;

const AutoplayFlags = {
  play: true,
  stopOnMouseEnter: true,
  stopOnInteraction: false,
};

function watchDragX(emblaApi: EmblaCarouselType) {
  emblaApi.on("pointerDown", watchMouse);

  let start: number | undefined;
  let end: number | undefined;

  return {
    get value() {
      return typeof start === "undefined" || typeof end === "undefined" ? 0 : end - start;
    },
    clean: () => {
      emblaApi.off("pointerDown", watchMouse);
      document.removeEventListener("mouseup", handleMouseUp);
    },
  };

  function watchMouse() {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }
  function handleMouseMove(event: MouseEvent) {
    document.removeEventListener("mousemove", handleMouseMove);
    start = event.clientX;
    end = undefined;
  }
  function handleMouseUp(event: MouseEvent) {
    document.removeEventListener("mouseup", handleMouseUp);
    end = event.clientX;
  }
}
