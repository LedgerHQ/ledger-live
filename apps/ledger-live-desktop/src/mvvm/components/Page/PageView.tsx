import React, { memo } from "react";
import TopBar from "~/renderer/components/TopBar";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { PageViewModelResult } from "./usePageViewModel";
import { ClassicLayout, Wallet40Layout, ScrollUpButton } from "./components";
import { isWallet40Page } from "./utils";
import RightPanel from "LLD/components/RightPanel";

type PageViewProps = PageViewModelResult & {
  readonly children: React.ReactNode;
};

/**
 * PageView
 * Main layout component that renders TopBar and content area
 * Switches between ClassicLayout and Wallet40Layout based on feature flag
 */
export const PageView = memo(function PageView({
  children,
  pageScrollerRef,
  isScrollUpButtonVisible,
  isScrollAtUpperBound,
  isWallet40Enabled,
  pathname,
  onClickScrollUp,
}: PageViewProps) {
  const shouldShowRightPanel = isWallet40Page(pathname);

  return (
    <div className="relative flex flex-1 flex-col">
      <TopBar />
      {isWallet40Enabled ? (
        <Wallet40Layout
          scrollerRef={pageScrollerRef}
          rightPanel={shouldShowRightPanel ? <RightPanel /> : undefined}
        >
          {children}
        </Wallet40Layout>
      ) : (
        <ClassicLayout scrollerRef={pageScrollerRef} isScrollAtUpperBound={isScrollAtUpperBound}>
          {children}
        </ClassicLayout>
      )}
      <ScrollUpButton isVisible={isScrollUpButtonVisible} onClick={onClickScrollUp} />
      {/* Only on dashboard page */}
      {pathname === "/" && <ActionContentCards variant={ABTestingVariants.variantB} />}
    </div>
  );
});
