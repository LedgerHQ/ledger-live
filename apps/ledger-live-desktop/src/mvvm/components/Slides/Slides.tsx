import React, { ReactNode } from "react";
import { cn } from "LLD/utils/cn";
import { SlidesContext } from "./context";
import { Content } from "./components/Content";
import { StaticSection } from "./components/StaticSection";
import { useSlidesViewModel } from "./useSlidesViewModel";

export type SlidesProps = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
  className?: string;
};

export function Slides({ children, onSlideChange, initialSlideIndex = 0, className }: SlidesProps) {
  const { scrollContainerRef, handleScroll, contextValue } = useSlidesViewModel({
    children,
    onSlideChange,
    initialSlideIndex,
  });

  return (
    <SlidesContext.Provider value={contextValue}>
      <div className={cn("flex flex-1 flex-col", className)}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === Content) {
            return (
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="scrollbar-none flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth"
              >
                {child.props.children}
              </div>
            );
          }
          if (React.isValidElement(child) && child.type === StaticSection) {
            return child;
          }
          return null;
        })}
      </div>
    </SlidesContext.Provider>
  );
}
