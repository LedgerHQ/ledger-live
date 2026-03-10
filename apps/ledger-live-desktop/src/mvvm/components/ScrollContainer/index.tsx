import React, { forwardRef } from "react";
import { cn } from "LLD/utils/cn";

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-0 scrollbar-custom w-full flex-1 overflow-auto [scrollbar-gutter:stable]",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

ScrollContainer.displayName = "ScrollContainer";
