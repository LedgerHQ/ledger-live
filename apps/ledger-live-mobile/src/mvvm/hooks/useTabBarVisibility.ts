import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import { updateMainNavigatorVisibility } from "~/actions/appstate";

/**
 * Controls tab bar visibility via Redux (`appstate.isMainNavigatorVisible`).
 * Use `useHideTabBar` instead for the common mount/unmount hide pattern.
 */
export function useTabBarVisibility() {
  const dispatch = useDispatch();
  const isTabBarVisible = useSelector(isMainNavigatorVisibleSelector);

  const showTabBar = useCallback(() => {
    dispatch(updateMainNavigatorVisibility(true));
  }, [dispatch]);

  const hideTabBar = useCallback(() => {
    dispatch(updateMainNavigatorVisibility(false));
  }, [dispatch]);

  return {
    isTabBarVisible,
    showTabBar,
    hideTabBar,
  } as const;
}

/**
 * Hides the tab bar on mount and restores the previous visibility state on unmount.
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
