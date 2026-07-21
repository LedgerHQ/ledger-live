import { useCallback, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { SCROLL_TO_TOP_EVENT } from "./constants";
import { shouldDisplayRightPanel as isRightPanelPage } from "./utils";
import { useRightPanelVisibility } from "LLD/components/RightPanel/useRightPanelVisibility";
import { useRightPanelSwapAvailability } from "LLD/components/RightPanel/useRightPanelSwapAvailability";

export interface PageViewModelResult {
  readonly pageScrollerRef: (node: HTMLDivElement | null) => void;
  readonly shouldRenderRightPanel: boolean;
}

export const usePageViewModel = (): PageViewModelResult => {
  const [scrollerElement, setScrollerElement] = useState<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const isRightPanelEnabled = useRightPanelVisibility();
  const isSwapAvailableForRoute = useRightPanelSwapAvailability(pathname);

  const shouldRenderRightPanel =
    isRightPanelPage(pathname, { shouldDisplayAggregatedAssets }) &&
    isRightPanelEnabled &&
    isSwapAvailableForRoute;

  // Callback ref to capture the scroller element
  const pageScrollerRef = useCallback((node: HTMLDivElement | null) => {
    setScrollerElement(node);
  }, []);

  const scrollToTop = useCallback(
    (smooth = true) => {
      if (scrollerElement) {
        scrollerElement.scrollTo({
          top: 0,
          behavior: smooth ? "smooth" : undefined,
        });
      }
    },
    [scrollerElement],
  );

  // When sidebar (or elsewhere) dispatches SCROLL_TO_TOP_EVENT, scroll the page scroller to top
  useLayoutEffect(() => {
    const handler = () => scrollToTop(true);
    globalThis.addEventListener(SCROLL_TO_TOP_EVENT, handler);
    return () => globalThis.removeEventListener(SCROLL_TO_TOP_EVENT, handler);
  }, [scrollToTop]);

  // Scroll to top when pathname changes
  useLayoutEffect(() => {
    scrollToTop(false);
  }, [pathname, scrollToTop]);

  return {
    pageScrollerRef,
    shouldRenderRightPanel,
  };
};
