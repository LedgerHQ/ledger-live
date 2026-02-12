import { useCallback, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { SCROLL_UP_BUTTON_THRESHOLD } from "./constants";
import { shouldDisplayRightPanel as isRightPanelPage } from "./utils";
import { useRightPanelViewModel } from "LLD/components/RightPanel/useRightPanelViewModel";

export interface PageViewModelResult {
  readonly pageScrollerRef: (node: HTMLDivElement | null) => void;
  readonly isScrollUpButtonVisible: boolean;
  readonly isScrollAtUpperBound: boolean;
  readonly isWallet40Enabled: boolean;
  readonly shouldDisplayWallet40MainNav: boolean;
  readonly pathname: string;
  readonly onClickScrollUp: () => void;
  readonly shouldRenderRightPanel: boolean;
}

export const usePageViewModel = (): PageViewModelResult => {
  const [scrollerElement, setScrollerElement] = useState<HTMLDivElement | null>(null);
  const [isScrollUpButtonVisible, setScrollUpButtonVisibility] = useState(false);
  const [isScrollAtUpperBound, setScrollAtUpperBound] = useState(true);
  const { pathname } = useLocation();
  const { isEnabled: isWallet40Enabled, shouldDisplayWallet40MainNav } =
    useWalletFeaturesConfig("desktop");
  const { shouldDisplay: isRightPanelEnabled } = useRightPanelViewModel();

  const shouldRenderRightPanel = isRightPanelPage(pathname) && isRightPanelEnabled;

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

  const onClickScrollUp = useCallback(() => scrollToTop(), [scrollToTop]);

  // Scroll to top when pathname changes
  useLayoutEffect(() => {
    scrollToTop(false);
  }, [pathname, scrollToTop]);

  // Attach scroll listener when element is available
  useLayoutEffect(() => {
    if (!scrollerElement) return;

    const listener = () => {
      setScrollAtUpperBound(scrollerElement.scrollTop === 0);
      setScrollUpButtonVisibility(scrollerElement.scrollTop > SCROLL_UP_BUTTON_THRESHOLD);
    };

    // Check initial scroll position
    listener();

    scrollerElement.addEventListener("scroll", listener, { passive: true });

    return () => {
      scrollerElement.removeEventListener("scroll", listener);
    };
  }, [scrollerElement]);

  return {
    pageScrollerRef,
    isScrollUpButtonVisible,
    isScrollAtUpperBound,
    isWallet40Enabled,
    shouldDisplayWallet40MainNav,
    pathname,
    onClickScrollUp,
    shouldRenderRightPanel,
  };
};
