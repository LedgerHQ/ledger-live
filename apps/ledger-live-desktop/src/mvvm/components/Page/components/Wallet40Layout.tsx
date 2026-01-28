import React, { memo } from "react";
import { cn } from "LLD/utils/cn";

interface Wallet40LayoutProps {
  readonly children: React.ReactNode;
  readonly scrollerRef: (node: HTMLDivElement | null) => void;
  readonly rightPanel: React.ReactNode | undefined;
}

/**
 * Wallet 4.0 Layout
 * Pure Tailwind implementation with right panel support
 * Provides consistent spacing: 32px horizontal/top padding, 32px gap between sections
 */
export const Wallet40Layout = memo(function Wallet40Layout({
  children,
  scrollerRef,
  rightPanel,
}: Wallet40LayoutProps) {
  return (
    <div className={cn("flex flex-1 gap-32 overflow-hidden px-32")}>
      <div id="scroll-area" className="relative flex flex-1 flex-col overflow-hidden">
        <div
          id="page-scroller"
          ref={scrollerRef}
          className="flex flex-1 flex-col overflow-y-auto pt-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative flex h-full flex-1 flex-col">{children}</div>
        </div>
      </div>
      {rightPanel}
    </div>
  );
});
