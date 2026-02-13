import React, { ReactNode } from "react";
import { cn } from "LLD/utils/cn";
import { SlidesContext } from "./context";
import { Content } from "./components/Content";
import { StaticSection } from "./components/StaticSection";
import { useSlidesViewModel } from "./useSlidesViewModel";
import { isValidReactElement } from "@ledgerhq/react-ui";

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
  const { contextValue } = useSlidesViewModel({
    children,
    onSlideChange,
    initialSlideIndex,
  });

  type ContentElement = React.ReactElement<{
    children: ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }>;
  const isContentElement = (child: React.ReactNode): child is ContentElement =>
    isValidReactElement(child) && child.type === Content;

  const renderChildren = () =>
    React.Children.map(children, child => {
      if (isContentElement(child)) {
        const slideItems = React.Children.toArray(child.props.children);

        return (
          <div
            style={child.props.style}
            className={cn("grid min-h-0 flex-1 overflow-hidden", child.props.className)}
          >
            {slideItems.map((slideItem, index) => {
              const isActive = index === contextValue.currentIndex;
              const isOutgoing = index === contextValue.previousIndex;
              const zIndex = isOutgoing ? 2 : isActive ? 1 : 0;
              return (
                <div
                  key={index}
                  role="group"
                  aria-hidden={!isActive}
                  className={cn(
                    "col-start-1 row-start-1 min-h-0 flex-1 overflow-hidden",
                    !isActive && "pointer-events-none",
                  )}
                  style={{ zIndex }}
                >
                  {slideItem}
                </div>
              );
            })}
          </div>
        );
      }
      if (isValidReactElement(child) && child.type === StaticSection) {
        return child;
      }
      return null;
    });

  return (
    <SlidesContext.Provider value={contextValue}>
      <div className={cn("flex flex-1 flex-col", className)}>{renderChildren()}</div>
    </SlidesContext.Provider>
  );
}
