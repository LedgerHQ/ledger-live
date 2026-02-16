import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import { updateMainNavigatorVisibility } from "~/actions/appstate";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Hook to control tab bar visibility in Wallet 4.0.
 *
 * This hook provides a clean API to show/hide the main tab bar navigation
 * by managing the underlying Redux state (`appstate.isMainNavigatorVisible`).
 *
 * **Requirements:**
 * - Only available when the `lwmWallet40` feature flag is active
 * - Throws an error if used outside Wallet 4.0 context
 *
 * **Use Cases:**
 * - Hide tab bar during full-screen experiences (video, camera, onboarding)
 * - Show tab bar when returning to standard navigation
 * - Coordinate with modal/drawer states
 *
 * @throws {Error} If the `lwmWallet40` feature flag is not enabled
 *
 * @example
 * ```tsx
 * function FullScreenCamera() {
 *   const { hideTabBar, showTabBar } = useTabBarVisibility();
 *
 *   useEffect(() => {
 *     hideTabBar();
 *     return () => showTabBar(); // Cleanup on unmount
 *   }, [hideTabBar, showTabBar]);
 *
 *   return <CameraView />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function VideoPlayer() {
 *   const { isTabBarVisible, hideTabBar, showTabBar } = useTabBarVisibility();
 *
 *   const toggleFullscreen = () => {
 *     if (isTabBarVisible) {
 *       hideTabBar();
 *     } else {
 *       showTabBar();
 *     }
 *   };
 *
 *   return (
 *     <Video onPress={toggleFullscreen}>
 *       {!isTabBarVisible && <FullscreenControls />}
 *     </Video>
 *   );
 * }
 * ```
 *
 * @returns An object containing:
 * - `isTabBarVisible` - Current visibility state of the tab bar
 * - `showTabBar` - Function to make the tab bar visible
 * - `hideTabBar` - Function to hide the tab bar
 */
export function useTabBarVisibility() {
  const dispatch = useDispatch();
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("mobile");
  const isTabBarVisible = useSelector(isMainNavigatorVisibleSelector);

  const showTabBar = useCallback(() => {
    dispatch(updateMainNavigatorVisibility(true));
  }, [dispatch]);

  const hideTabBar = useCallback(() => {
    dispatch(updateMainNavigatorVisibility(false));
  }, [dispatch]);

  // Fail-fast: Prevent usage in non-Wallet40 contexts
  if (!isWallet40Enabled) {
    throw new Error(
      "[useTabBarVisibility] This hook requires the 'lwmWallet40' feature flag to be enabled. " +
        "Ensure that any component using this hook is only rendered within Wallet 4.0-gated navigation trees " +
        "where useWalletFeaturesConfig('mobile').isEnabled is true, or handle this error via an error boundary.",
    );
  }

  return {
    isTabBarVisible,
    showTabBar,
    hideTabBar,
  } as const;
}

/**
 * Type representing the return value of useTabBarVisibility hook.
 * Useful for type-safe prop passing and testing.
 */
export type TabBarVisibility = ReturnType<typeof useTabBarVisibility>;

/**
 * Hook to automatically hide the tab bar on mount and restore it on unmount.
 *
 * This is a convenience hook that wraps `useTabBarVisibility` and handles the
 * common pattern of hiding the tab bar when a component mounts and restoring
 * the previous visibility state when the component unmounts.
 *
 * **Important:** This hook restores the initial visibility state (captured on mount),
 * not always showing the tab bar. This prevents interfering with parent components
 * or navigation flows that may have already hidden the tab bar.
 *
 * **Use this hook when:**
 * - You want to hide the tab bar for the entire lifecycle of a screen/component
 * - You don't need manual control over show/hide
 * - You want to avoid repetitive useEffect cleanup patterns
 *
 * **Use `useTabBarVisibility` instead when:**
 * - You need manual control (conditional show/hide)
 * - You want to toggle visibility based on user interaction
 * - You need access to the current visibility state
 *
 * @throws {Error} If the `lwmWallet40` feature flag is not enabled
 *
 * @example
 * ```tsx
 * function FullScreenCamera() {
 *   // Tab bar automatically hidden on mount, restored on unmount
 *   useHideTabBar();
 *
 *   return <CameraView />;
 * }
 * ```
 */
export function useHideTabBar(): void {
  const { isTabBarVisible, hideTabBar, showTabBar } = useTabBarVisibility();
  const initialVisibilityRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Capture the initial state on mount
    if (initialVisibilityRef.current === null) {
      initialVisibilityRef.current = isTabBarVisible;
    }

    hideTabBar();

    return () => {
      // Restore the initial state on unmount
      if (initialVisibilityRef.current) {
        showTabBar();
      }
    };
  }, [isTabBarVisible, hideTabBar, showTabBar]);
}
