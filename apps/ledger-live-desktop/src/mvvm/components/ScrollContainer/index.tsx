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
          "min-h-0 w-full flex-1 overflow-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-[6px] [&::-webkit-scrollbar-thumb]:bg-muted-strong [&::-webkit-scrollbar-track]:rounded-[6px] [&::-webkit-scrollbar-track]:bg-muted",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

ScrollContainer.displayName = "ScrollContainer";
