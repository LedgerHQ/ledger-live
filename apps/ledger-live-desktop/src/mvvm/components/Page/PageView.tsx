import React, { memo } from "react";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { PageViewModelResult } from "./usePageViewModel";
import { Wallet40Layout } from "./components";
import RightPanel from "LLD/components/RightPanel";
import Wallet40TopBar from "LLD/components/TopBar";

type PageViewProps = PageViewModelResult & {
  readonly children: React.ReactNode;
};

/**
 * PageView
 * Main layout component that renders TopBar and content area
 */
export const PageView = memo(function PageView({
  children,
  pageScrollerRef,
  shouldDisplayBrazePlacement,
  pathname,
  shouldRenderRightPanel,
}: PageViewProps) {
  return (
    <div className="relative flex flex-1 flex-col min-w-0">
      <Wallet40TopBar />

      <Wallet40Layout
        scrollerRef={pageScrollerRef}
        rightPanel={shouldRenderRightPanel ? <RightPanel /> : undefined}
      >
        {children}
      </Wallet40Layout>

      {/* Only on dashboard; hide sticky variant when Braze placement (cards shown in banner only) */}
      {pathname === "/" && !shouldDisplayBrazePlacement && (
        <ActionContentCards variant={ABTestingVariants.variantB} />
      )}
    </div>
  );
});
