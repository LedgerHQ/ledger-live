import React, { memo } from "react";
import { PageViewModelResult } from "./usePageViewModel";
import { Wallet40Layout } from "./components";
import RightPanel from "LLD/components/RightPanel";
import Wallet40TopBar from "LLD/components/TopBar";

type PageViewProps = PageViewModelResult & {
  readonly children: React.ReactNode;
};

const getPageTestId = (pathname: string): string => {
  const path = pathname.replace(/^\/+/, "");
  return `page-view-${path || "dashboard"}`;
};

/**
 * PageView
 * Main layout component that renders TopBar and content area
 */
export const PageView = memo(function PageView({
  children,
  pageScrollerRef,
  shouldRenderRightPanel,
}: PageViewProps) {
  return (
    <div className="relative flex flex-1 flex-col min-w-0" data-testid={getPageTestId(pathname)}>
      <Wallet40TopBar />

      <Wallet40Layout
        scrollerRef={pageScrollerRef}
        rightPanel={shouldRenderRightPanel ? <RightPanel /> : undefined}
      >
        {children}
      </Wallet40Layout>
    </div>
  );
});
