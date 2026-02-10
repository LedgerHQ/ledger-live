import React, { memo } from "react";
import { RIGHT_PANEL_WIDTH } from "LLD/components/Page/constants";

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
    <div
      className="grid flex-1 gap-32 overflow-hidden pr-32 pl-16"
      style={rightPanel ? { gridTemplateColumns: `1fr ${RIGHT_PANEL_WIDTH}px` } : undefined}
    >
      <div id="scroll-area" className="relative flex min-w-0 flex-col overflow-hidden">
        <div
          id="page-scroller"
          ref={scrollerRef}
          className="scrollbar-none flex flex-1 flex-col overflow-y-auto pl-16"
        >
          <div className="relative flex h-full flex-1 flex-col">{children}</div>
        </div>
      </div>
      {rightPanel}
    </div>
  );
});
