import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useProductTourSlideItemViewModel } from "../hooks/useProductTourSlideItemViewModel";

interface ProductTourSlideItemProps {
  readonly slideIndex: number;
}

export function ProductTourSlideItem({ slideIndex }: ProductTourSlideItemProps) {
  const { title, subtitle, lottieSrc, shouldAutoplay } = useProductTourSlideItemViewModel({
    slideIndex,
  });

  return (
    <div className="flex size-full flex-col">
      <div
        className="flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={{ height: 208 }}
      >
        <DotLottieReact
          src={lottieSrc}
          loop={true}
          autoplay={shouldAutoplay}
          layout={{ fit: "contain" }}
          style={{ width: 208, height: 208 }}
        />
      </div>

      <div
        className="flex flex-1 flex-col items-center px-20"
        style={{ gap: 30, paddingBottom: 8 }}
      >
        <div className="flex animate-fade-in flex-col items-center text-center">
          <div>
            <h3 className="m-0 mb-8 heading-4-semi-bold text-base">{title}</h3>
            <p className="m-0 body-2 text-muted">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
