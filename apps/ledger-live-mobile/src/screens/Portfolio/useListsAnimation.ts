import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { LayoutChangeEvent } from "react-native";
import { TAB_OPTIONS } from "./PortfolioAssets";
import { track } from "~/analytics";

type TabListType = (typeof TAB_OPTIONS)[keyof typeof TAB_OPTIONS];

const useListsAnimation = (initialTab: TabListType) => {
  const [selectedTab, setSelectedTab] = useState<TabListType>(initialTab);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const assetsTranslateX = useSharedValue<number>(0);
  const assetsOpacity = useSharedValue<number>(1);

  const accountsTranslateX = useSharedValue<number>(containerWidth);
  const accountsOpacity = useSharedValue<number>(0);

  const handleToggle = (value: string) => {
    setSelectedTab(value as TabListType);
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
      assetsTranslateX.value = withTiming(0, { duration: 250 });
      assetsOpacity.value = withTiming(1, { duration: 250 });
      // Accounts tab is not selected so here is the end position
      accountsTranslateX.value = withTiming(containerWidth / 3, { duration: 250 });
      accountsOpacity.value = withTiming(0, { duration: 250 });
    } else {
      // Assets tab is not selected so here is the end position
      assetsTranslateX.value = withTiming(-containerWidth / 3, { duration: 250 });
      assetsOpacity.value = withTiming(0, { duration: 250 });
      // Accounts tab is selected so here is the default position
      accountsTranslateX.value = withTiming(-containerWidth / 2, { duration: 250 });
      accountsOpacity.value = withTiming(1, { duration: 250 });
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
    selectedTab,
    handleToggle,
    handleLayout,
    assetsAnimatedStyle,
    accountsAnimatedStyle,
  };
};

export default useListsAnimation;
