import { useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import { TAB_BAR_HEIGHT } from "~/components/TabBar/shared";

export const TOP_BAR_CONTENT_HEIGHT = 48;
export const TOP_BAR_WRAPPER_PADDING_TOP = 8;
const TOP_BAR_BAR_BOTTOM_PADDING = 8;
const TOP_BAR_BAR_HEIGHT =
  TOP_BAR_WRAPPER_PADDING_TOP + TOP_BAR_CONTENT_HEIGHT + TOP_BAR_BAR_BOTTOM_PADDING;
const IOS_BLUR_EXTRA_HEIGHT = 16;
const ANDROID_GRADIENT_EXTRA_HEIGHT = 4;
const MAIN_NAV_TOP_BAR_HEIGHT_IOS = TOP_BAR_BAR_HEIGHT + IOS_BLUR_EXTRA_HEIGHT;
const MAIN_NAV_TOP_BAR_HEIGHT_ANDROID = TOP_BAR_BAR_HEIGHT + ANDROID_GRADIENT_EXTRA_HEIGHT;

export interface NavigationBarHeights {
  readonly top: number;
  readonly bottom: number;
  readonly bottomBarHeight: number;
  readonly topBarHeight: number;
}

/**
 * Hook to calculate navigation bar heights for Wallet 4.0 screens.
 *
 * Returns top and bottom offsets to account for navigation bars (TopBar + TabBar).
 * Used primarily for PTX WebView screens that need proper content padding.
 * Returns zero values when the `lwmWallet40` feature flag is disabled.
 *
 * @example
 * ```tsx
 * const { top, bottom, topBarHeight, bottomBarHeight } = useNavigationBarHeights();
 * const webviewInputs = {
 *   paddingTop: top.toString(),
 *   paddingBottom: bottom.toString(),
 *   topBarHeight: topBarHeight.toString(),
 *   bottomBarHeight: bottomBarHeight.toString(),
 * };
 * ```
 *
 * @returns `{ top: number, bottom: number }` - Top is safe area + 80px (iOS) or 68px (Android), bottom is 56px or 0
 */
export function useNavigationBarHeights(): NavigationBarHeights {
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("mobile");
  const insets = useSafeAreaInsets();
  const isTabBarVisible = useSelector(isMainNavigatorVisibleSelector);

  const topBarHeight =
    Platform.OS === "ios" ? MAIN_NAV_TOP_BAR_HEIGHT_IOS : MAIN_NAV_TOP_BAR_HEIGHT_ANDROID;

  const result = useMemo(
    () => ({
      bottom: isTabBarVisible ? TAB_BAR_HEIGHT : 0,
      bottomBarHeight: TAB_BAR_HEIGHT,
      top: insets.top + topBarHeight,
      topBarHeight,
    }),
    [insets.top, topBarHeight, isTabBarVisible],
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
