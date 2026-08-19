import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import useEmblaCarousel from "embla-carousel-react";

import { ScrollEdge } from "LLD/components/HorizontalScroll/ScrollEdge";
import {
  HARDWARE_CAROUSEL_ITEM_GAP_PX,
  HARDWARE_CAROUSEL_SLIDE_WIDTH_PX,
} from "../../utils/hardwareCarouselLayout";

const LEADING_SLIDE_KEY = "category-carousel-leading";

type CategoryCarouselProps = Readonly<{
  slides: ReactElement[];
  leadingSlide?: React.ReactNode;
}>;

export default CategoryCarousel;

function CategoryCarousel({ slides, leadingSlide }: CategoryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    // Cards carry their own onClick/onDismiss handlers: letting the user drag the
    // carousel with the mouse would fight with those clicks. Navigation is arrow-only,
    // matching the other card lists in the app (HorizontalScroll/ScrollEdge).
    watchDrag: false,
  });

  const slideEntries = useMemo(() => {
    const entries: { key: string; node: React.ReactNode }[] = [];
    if (leadingSlide) {
      entries.push({ key: LEADING_SLIDE_KEY, node: leadingSlide });
    }
    slides.forEach(slide => {
      entries.push({ key: String(slide.key), node: slide });
    });
    return entries;
  }, [leadingSlide, slides]);

  const slideKeys = slideEntries.map(entry => entry.key).join("|");
  const previousSlideCountRef = useRef(slideEntries.length);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const previousSlideCount = previousSlideCountRef.current;
    const nextSlideCount = slideEntries.length;
    const selectedIndex = emblaApi.selectedScrollSnap();

    if (nextSlideCount < previousSlideCount && selectedIndex >= nextSlideCount) {
      emblaApi.scrollTo(Math.max(0, nextSlideCount - 1));
    }

    previousSlideCountRef.current = nextSlideCount;
  }, [slideKeys, emblaApi, slideEntries.length]);

  useEffect(() => {
    if (!emblaApi) return;

    updateScrollState();
    emblaApi.on("select", updateScrollState);
    emblaApi.on("reInit", updateScrollState);

    return () => {
      emblaApi.off("select", updateScrollState);
      emblaApi.off("reInit", updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  if (slideEntries.length === 0) return null;

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <div className="group relative" data-testid="category-carousel">
      {canScrollPrev && <ScrollEdge direction="left" onClick={scrollPrev} hideGradient />}
      {canScrollNext && <ScrollEdge direction="right" onClick={scrollNext} hideGradient />}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex items-start" style={{ gap: HARDWARE_CAROUSEL_ITEM_GAP_PX }}>
          {slideEntries.map(entry => (
            <div
              key={entry.key}
              className="min-w-0 shrink-0"
              style={{
                flex: `0 0 ${HARDWARE_CAROUSEL_SLIDE_WIDTH_PX}px`,
                width: HARDWARE_CAROUSEL_SLIDE_WIDTH_PX,
              }}
            >
              {entry.node}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
