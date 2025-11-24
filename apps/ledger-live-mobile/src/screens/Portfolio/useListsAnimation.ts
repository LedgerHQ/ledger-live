import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useState, useEffect, useRef } from "react";
import { TAB_OPTIONS } from "./TabSection";
import { track } from "~/analytics";
import { LayoutChangeEvent } from "react-native/Libraries/Types/CoreEventTypes";
import { useDispatch } from "react-redux";
import { setSelectedTabPortfolioAssets } from "~/actions/settings";

export type TabListType = (typeof TAB_OPTIONS)[keyof typeof TAB_OPTIONS];

const ANIMATION_DURATION = 250;

const useListsAnimation = (initialTab: TabListType) => {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState<TabListType>(initialTab);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [assetsHeight, setAssetsHeight] = useState<number>(0);
  const [accountsHeight, setAccountsHeight] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const [accountsButtonHeight, setAccountsButtonHeight] = useState<number>(0);
  const [assetsButtonHeight, setAssetsButtonHeight] = useState<number>(0);
  const hasSetInitialPositions = useRef<boolean>(false);

  // Position the selected tab at 0, and the hidden tab far off-screen to prevent overlap/interference
  const assetsTranslateX = useSharedValue<number>(initialTab === TAB_OPTIONS.Assets ? 0 : -1000);
  const assetsOpacity = useSharedValue<number>(initialTab === TAB_OPTIONS.Assets ? 1 : 0);
  const accountsTranslateX = useSharedValue<number>(initialTab === TAB_OPTIONS.Accounts ? 0 : 1000);
  const accountsOpacity = useSharedValue<number>(initialTab === TAB_OPTIONS.Accounts ? 1 : 0);

  const handleToggle = (value: TabListType) => {
    setSelectedTab(value);
    dispatch(setSelectedTabPortfolioAssets(value));

    // Only update if we have actual measurements
    const isAssets = value === TAB_OPTIONS.Assets;
    const height = isAssets ? assetsHeight : accountsHeight;
    const buttonHeight = isAssets ? assetsButtonHeight : accountsButtonHeight;

    if (height > 0 || buttonHeight > 0) {
      setContainerHeight(height + buttonHeight);
    }

    track("button_clicked", {
      button: value,
      page: "Wallet",
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    // Get the width of the container and set it to the state so we can use the width in the animation
    const { width } = event.nativeEvent.layout;
    const isFirstLayout = containerWidth === 0;

    setContainerWidth(width);

    // On first layout, set positions instantly without animation to avoid clipping issues on CI
    // On subsequent layouts, also set positions to ensure correct state after navigation
    if (width > 0) {
      const shouldAnimate = !isFirstLayout && hasSetInitialPositions.current;
      hasSetInitialPositions.current = true;

      if (selectedTab === TAB_OPTIONS.Assets) {
        assetsTranslateX.value = shouldAnimate
          ? withTiming(0, { duration: ANIMATION_DURATION })
          : 0;
        assetsOpacity.value = shouldAnimate ? withTiming(1, { duration: ANIMATION_DURATION }) : 1;
        accountsTranslateX.value = shouldAnimate
          ? withTiming(width / 3, { duration: ANIMATION_DURATION })
          : width / 3;
        accountsOpacity.value = shouldAnimate ? withTiming(0, { duration: ANIMATION_DURATION }) : 0;
      } else {
        assetsTranslateX.value = shouldAnimate
          ? withTiming(-width / 3, { duration: ANIMATION_DURATION })
          : -width / 3;
        assetsOpacity.value = shouldAnimate ? withTiming(0, { duration: ANIMATION_DURATION }) : 0;
        accountsTranslateX.value = shouldAnimate
          ? withTiming(-width / 2, { duration: ANIMATION_DURATION })
          : -width / 2;
        accountsOpacity.value = shouldAnimate ? withTiming(1, { duration: ANIMATION_DURATION }) : 1;
      }
    }
  };

  const handleButtonLayout = (tab: TabListType, event: LayoutChangeEvent) => {
    // Get Height of the buttons section
    const { height } = event.nativeEvent.layout;
    if (height === 0) return; // avoid layout blinking when switching tabs
    if (tab === TAB_OPTIONS.Assets) setAssetsButtonHeight(height);
    else setAccountsButtonHeight(height);
  };

  useEffect(() => {
    // Set the height of the container based on the selected tab
    // Only update if we have actual measurements (avoid setting to 0 on first render)
    const isAssets = selectedTab === TAB_OPTIONS.Assets;
    const height = isAssets ? assetsHeight : accountsHeight;
    const buttonHeight = isAssets ? assetsButtonHeight : accountsButtonHeight;

    if (height > 0 || buttonHeight > 0) {
      setContainerHeight(height + buttonHeight);
    }
  }, [selectedTab, assetsHeight, accountsHeight, assetsButtonHeight, accountsButtonHeight]);

  const handleAssetsContentSizeChange = (width: number, height: number) => {
    // Set the height of the assets list every time there is a change in the list
    setAssetsHeight(height);
  };

  const handleAccountsContentSizeChange = (width: number, height: number) => {
    // Set the height of the accounts list every time there is a change in the list
    setAccountsHeight(height);
  };

  const assetsAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: assetsTranslateX.value }],
      opacity: assetsOpacity.value,
    }),
    [assetsTranslateX, assetsOpacity],
  );

  const accountsAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: accountsTranslateX.value }],
      opacity: accountsOpacity.value,
    }),
    [accountsTranslateX, accountsOpacity],
  );

  useEffect(() => {
    // Skip animation if containerWidth is not yet measured or initial positions not set
    if (containerWidth === 0 || !hasSetInitialPositions.current) {
      return;
    }

    // Use requestAnimationFrame to ensure layout is complete before starting animations
    const rafId = requestAnimationFrame(() => {
      if (selectedTab === TAB_OPTIONS.Assets) {
        // Assets tab is selected so here is the default position
        assetsTranslateX.value = withTiming(0, {
          duration: ANIMATION_DURATION,
        });
        assetsOpacity.value = withTiming(1, {
          duration: ANIMATION_DURATION,
        });
        // Accounts tab is not selected so here is the end position
        accountsTranslateX.value = withTiming(containerWidth / 3, {
          duration: ANIMATION_DURATION,
        });
        accountsOpacity.value = withTiming(0, {
          duration: ANIMATION_DURATION,
        });
      } else {
        // Assets tab is not selected so here is the end position
        assetsTranslateX.value = withTiming(-containerWidth / 3, {
          duration: ANIMATION_DURATION,
        });
        assetsOpacity.value = withTiming(0, {
          duration: ANIMATION_DURATION,
        });
        // Accounts tab is selected so here is the default position
        accountsTranslateX.value = withTiming(-containerWidth / 2, {
          duration: ANIMATION_DURATION,
        });
        accountsOpacity.value = withTiming(1, {
          duration: ANIMATION_DURATION,
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    selectedTab,
    containerWidth,
    assetsTranslateX,
    accountsTranslateX,
    assetsOpacity,
    accountsOpacity,
  ]);

  return {
    handleToggle,
    handleLayout,
    handleButtonLayout,
    handleAssetsContentSizeChange,
    handleAccountsContentSizeChange,
    selectedTab,
    assetsAnimatedStyle,
    accountsAnimatedStyle,
    containerHeight,
  };
};

export default useListsAnimation;
