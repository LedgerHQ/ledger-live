import { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";

type Props = {
  displayBanner: boolean;
};
const BOTTOM_MARGIN_WITH_BANNER = 50;
const TOP_PADDING_WITH_BANNER = 16;

const ANIMATION_CONFIG = {
  duration: 200,
};

const useBannerAnimation = ({ displayBanner }: Props) => {
  const [bannerHeight, setBannerHeight] = useState(0);

  const onBannerLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setBannerHeight(height);
  }, []);

  const getAnimatedValue = (isDisplayed: boolean, fromValue: number, toValue: number) => {
    "worklet";
    return isDisplayed
      ? withTiming(toValue, ANIMATION_CONFIG)
      : withTiming(fromValue, ANIMATION_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const translateY = getAnimatedValue(displayBanner, bannerHeight, 0);
    const opacity = getAnimatedValue(displayBanner, 0, 1);
    const paddingTop = getAnimatedValue(displayBanner, 0, TOP_PADDING_WITH_BANNER);
    const height = getAnimatedValue(displayBanner, 0, bannerHeight + BOTTOM_MARGIN_WITH_BANNER);

    return {
      transform: [{ translateY }],
      opacity,
      height,
      paddingTop,
    };
  });

  return { onBannerLayout, animatedStyle };
};

export default useBannerAnimation;
