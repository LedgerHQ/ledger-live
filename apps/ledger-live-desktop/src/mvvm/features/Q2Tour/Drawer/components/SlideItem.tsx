import React from "react";
import {
  AwarenessModalClampedText,
  CAROUSEL_SLIDE_TEXT_LINE_LIMITS,
} from "LLD/features/GenericAwarenessModal/components/clampedText";
import { useQ2TourSlideItemViewModel } from "../hooks/useQ2TourSlideItemViewModel";

interface SlideItemProps {
  readonly slideIndex: number;
}

export function SlideItem({ slideIndex }: SlideItemProps) {
  const { title, description, imageSrc } = useQ2TourSlideItemViewModel({ slideIndex });

  return (
    <div className="flex size-full flex-col">
      <div className="pb-24 overflow-hidden w-full">
        <img
          src={imageSrc}
          alt=""
          className="pointer-events-none h-[200px] w-full select-none rounded-xl object-cover"
          draggable={false}
          decoding="async"
        />
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
            {description ? (
              <AwarenessModalClampedText
                text={description}
                maxLines={CAROUSEL_SLIDE_TEXT_LINE_LIMITS.subtitle}
                className="body-2 text-center text-muted"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
