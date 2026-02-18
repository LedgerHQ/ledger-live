import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import { TAB_BAR_HEIGHT } from "~/components/TabBar/shared";

const TOP_BAR_HEIGHT = 60;

export interface NavigationBarHeights {
  readonly top: number;
  readonly bottom: number;
}

/**
 * Hook to calculate navigation bar heights for Wallet 4.0 screens.
 *
 * Returns top and bottom offsets to account for navigation bars (TopBar + TabBar).
 * Used primarily for PTX WebView screens that need proper content padding.
 *
 * @throws {Error} If the `lwmWallet40` feature flag is not enabled
 *
 * @example
 * ```tsx
 * const { top, bottom } = useNavigationBarHeights();
 * const webviewInputs = {
 *   paddingTop: top.toString(),
 *   paddingBottom: bottom.toString(),
 * };
 * ```
 *
 * @returns `{ top: number, bottom: number }` - Top includes safe area + 60px, bottom is 56px or 0
 */
export function useNavigationBarHeights(): NavigationBarHeights {
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("mobile");
  const insets = useSafeAreaInsets();
  const isTabBarVisible = useSelector(isMainNavigatorVisibleSelector);

  const result = useMemo(
    () => ({
      top: insets.top + TOP_BAR_HEIGHT,
      bottom: isTabBarVisible ? TAB_BAR_HEIGHT : 0,
    }),
    [insets.top, isTabBarVisible],
  );

  if (!isWallet40Enabled) {
    throw new Error(
      "[useNavigationBarHeights] This hook requires the 'lwmWallet40' feature flag to be enabled. " +
        "Ensure that any component using this hook is only rendered within Wallet 4.0-gated navigation trees " +
        "where useWalletFeaturesConfig('mobile').isEnabled is true, or handle this error via an error boundary.",
    );
  }

  return result;
}
