import React from "react";
import { cn } from "LLD/utils/cn";
import { useHorizontalScroll } from "./hooks/useHorizontalScroll";
import { ScrollEdge } from "./ScrollEdge";

type HorizontalScrollProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly scrollContainerClassName?: string;
  readonly scrollContainerTestId?: string;
  readonly scrollLeftLabelKey?: string;
  readonly scrollRightLabelKey?: string;
  readonly hideGradient?: boolean;
  readonly "data-testid"?: string;
};

export const HorizontalScroll = ({
  children,
  className,
  scrollContainerClassName,
  scrollContainerTestId,
  scrollLeftLabelKey,
  scrollRightLabelKey,
  hideGradient,
  ...rest
}: HorizontalScrollProps) => {
  const { scrollContainerRef, isAtStart, isAtEnd, scrollLeft, scrollRight } = useHorizontalScroll();

  return (
    <div className={cn("group relative", className)} {...rest}>
      {!isAtStart && (
        <ScrollEdge
          direction="left"
          onClick={scrollLeft}
          ariaLabelKey={scrollLeftLabelKey}
          hideGradient={hideGradient}
        />
      )}
      <div
        ref={scrollContainerRef}
        data-testid={scrollContainerTestId}
        className={cn("scrollbar-none overflow-x-auto", scrollContainerClassName)}
      >
        {children}
      </div>
      {!isAtEnd && (
        <ScrollEdge
          direction="right"
          onClick={scrollRight}
          ariaLabelKey={scrollRightLabelKey}
          hideGradient={hideGradient}
        />
      )}
    </div>
  );
};
