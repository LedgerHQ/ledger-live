import { useCallback, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { SCROLL_TO_TOP_EVENT } from "./constants";
import { getPageTestId, getRightPanelVariant, type RightPanelVariant } from "./utils";
import { useSwapVisibility } from "LLD/components/RightPanel/Swap/useSwapVisibility";
import { useSwapAvailability } from "LLD/components/RightPanel/Swap/useSwapAvailability";
import { useCardVisibility } from "LLD/components/RightPanel/Card/useCardVisibility";

export interface PageViewModelResult {
  readonly pageScrollerRef: (node: HTMLDivElement | null) => void;
  readonly shouldRenderRightPanel: boolean;
  readonly rightPanelVariant?: RightPanelVariant;
  readonly pageTestId: string;
}

export const usePageViewModel = (): PageViewModelResult => {
  const [scrollerElement, setScrollerElement] = useState<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const isSwapEnabled = useSwapVisibility();
  const isSwapAvailableForRoute = useSwapAvailability(pathname);
  const isCardEnabled = useCardVisibility();

  const variant = getRightPanelVariant(pathname, { shouldDisplayAggregatedAssets });
  const isSwapUsable = isSwapEnabled && isSwapAvailableForRoute;

  // Per-variant visibility gating. Exhaustive Record: adding a variant requires an entry here.
  const rightPanelVariantEnabled: Record<RightPanelVariant, boolean> = {
    swap: isSwapUsable,
    card: isCardEnabled,
  };

  const shouldRenderRightPanel = variant !== undefined && rightPanelVariantEnabled[variant];
  const rightPanelVariant = shouldRenderRightPanel ? variant : undefined;

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
    rightPanelVariant,
    pageTestId: getPageTestId(pathname),
  };
};
