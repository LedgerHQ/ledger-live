import React, { ReactNode, useState } from "react";
import { isValidReactElement } from "@ledgerhq/react-ui";
import { cn } from "LLD/utils/cn";
import { SlidesContext } from "./context";
import { Content } from "./components/Content";
import { StaticSection } from "./components/StaticSection";
import { useSlidesViewModel } from "./useSlidesViewModel";

const SLIDE_CLASSES = {
  forward: {
    enter: "animate-slide-in-from-right",
    exit: "animate-slide-out-to-left",
  },
  backward: {
    enter: "animate-slide-in-from-left",
    exit: "animate-slide-out-to-right",
  },
} as const;

type ContentElement = React.ReactElement<{
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}>;
const isContentElement = (child: React.ReactNode): child is ContentElement =>
  isValidReactElement(child) && child.type === Content;

export type SlidesProps = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
  className?: string;
};

export function Slides({
  children,
  onSlideChange,
  initialSlideIndex = 0,
  className,
}: Readonly<SlidesProps>) {
  const contextValue = useSlidesViewModel({
    children,
    onSlideChange,
    initialSlideIndex,
  });

  const [displayedIndex, setDisplayedIndex] = useState(contextValue.initialIndex);
  const direction = contextValue.currentIndex > displayedIndex ? 1 : -1;

  const slideClasses = direction > 0 ? SLIDE_CLASSES.forward : SLIDE_CLASSES.backward;

  return (
    <SlidesContext.Provider value={contextValue}>
      <div className={cn("flex flex-1 flex-col", className)}>
        {React.Children.map(children, child => {
          if (isContentElement(child)) {
            const slideItems = React.Children.toArray(child.props.children);
            const activeSlide = slideItems[displayedIndex];
            const contentClassName = child.props.className;
            const contentStyle = child.props.style;
            const isAnimating = displayedIndex !== contextValue.currentIndex;

            return (
              <div
                className={cn("grid min-h-0 flex-1 overflow-hidden", contentClassName)}
                style={contentStyle}
              >
                {activeSlide != null && (
                  <div
                    className={cn(
                      {
                        [slideClasses.enter]: isAnimating && direction < 0,
                        [slideClasses.exit]: isAnimating && direction > 0,
                      },
                      "col-start-1 row-start-1 min-h-0 flex-1 overflow-hidden",
                    )}
                    onAnimationStart={({ animationName }) => {
                      // We need to wait for the CSS slide-out animation to start before we can display the next slide
                      if (animationName.startsWith("slide-out")) {
                        setDisplayedIndex(contextValue.currentIndex);
                      }
                    }}
                  >
                    {activeSlide}
                  </div>
                )}
              </div>
            );
          }
          if (isValidReactElement(child) && child.type === StaticSection) {
            return child;
          }
          return null;
        })}
      </div>
    </SlidesContext.Provider>
  );
}
