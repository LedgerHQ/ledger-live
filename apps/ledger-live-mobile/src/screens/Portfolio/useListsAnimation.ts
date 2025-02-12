import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useState, useEffect } from "react";
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
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [accountsButtonHeight, setAccountsButtonHeight] = useState<number>(0);
  const [assetsButtonHeight, setAssetsButtonHeight] = useState<number>(0);

  const assetsTranslateX = useSharedValue<number>(0);
  const assetsOpacity = useSharedValue<number>(1);
  const accountsTranslateX = useSharedValue<number>(containerWidth);
  const accountsOpacity = useSharedValue<number>(0);

  const handleToggle = (value: TabListType) => {
    setSelectedTab(value);
    dispatch(setSelectedTabPortfolioAssets(value));

    if (value === TAB_OPTIONS.Assets) setContainerHeight(assetsHeight + assetsButtonHeight);
    else setContainerHeight(accountsHeight + accountsButtonHeight);

    track("button_clicked", {
      button: value,
      page: "Wallet",
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    // Get the width of the container and set it to the state so we can use the width in the animation
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
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
    if (selectedTab === TAB_OPTIONS.Assets) {
      setContainerHeight(assetsHeight + assetsButtonHeight);
    } else {
      setContainerHeight(accountsHeight + accountsButtonHeight);
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
    if (selectedTab === TAB_OPTIONS.Assets) {
      // Assets tab is selected so here is the default position
      assetsTranslateX.value = withTiming(0, { duration: ANIMATION_DURATION });
      assetsOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
      // Accounts tab is not selected so here is the end position
      accountsTranslateX.value = withTiming(containerWidth / 3, { duration: ANIMATION_DURATION });
      accountsOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    } else {
      // Assets tab is not selected so here is the end position
      assetsTranslateX.value = withTiming(-containerWidth / 3, { duration: ANIMATION_DURATION });
      assetsOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
      // Accounts tab is selected so here is the default position
      accountsTranslateX.value = withTiming(-containerWidth / 2, { duration: ANIMATION_DURATION });
      accountsOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    }
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
