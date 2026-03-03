import React, { ReactNode, useRef, useState, useEffect } from "react";
import { isValidReactElement } from "@ledgerhq/react-ui";
import { cn } from "LLD/utils/cn";
import { SlidesContext } from "./context";
import { Content } from "./components/Content";
import { StaticSection } from "./components/StaticSection";
import { useSlidesViewModel } from "./useSlidesViewModel";

const SLIDE_DURATION_MS = 300;

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
  const isExiting = displayedIndex !== contextValue.currentIndex;
  const transitionDirectionRef = useRef<1 | -1>(1);

  if (isExiting) {
    transitionDirectionRef.current = contextValue.currentIndex > displayedIndex ? 1 : -1;
  }
  const direction = transitionDirectionRef.current;
  const slideClasses = direction > 0 ? SLIDE_CLASSES.forward : SLIDE_CLASSES.backward;

  useEffect(() => {
    if (displayedIndex !== contextValue.currentIndex) {
      const t = setTimeout(() => setDisplayedIndex(contextValue.currentIndex), SLIDE_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [contextValue.currentIndex, displayedIndex]);

  return (
    <SlidesContext.Provider value={contextValue}>
      <div className={cn("flex flex-1 flex-col", className)}>
        {React.Children.map(children, child => {
          if (isContentElement(child)) {
            const slideItems = React.Children.toArray(child.props.children);
            const activeSlide = slideItems[displayedIndex];
            const contentClassName = "className" in child.props ? child.props.className : undefined;
            const contentStyle = "style" in child.props ? child.props.style : undefined;

            return (
              <div
                className={cn("grid min-h-0 flex-1 overflow-hidden", contentClassName)}
                style={contentStyle}
              >
                {activeSlide != null && (
                  <div
                    key={displayedIndex}
                    className={cn(
                      isExiting ? slideClasses.exit : slideClasses.enter,
                      "col-start-1 row-start-1 min-h-0 flex-1 overflow-hidden",
                    )}
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
