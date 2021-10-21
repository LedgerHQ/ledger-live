import React from "react";
import type { ScrollViewProps } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import Header from "./Header";
import type { HeaderProps } from "./Header";

type ScrollContainerHeaderProps = Omit<HeaderProps, "currentPositionY"> &
  Omit<ScrollViewProps, "onScroll"> & {
    children?: React.ReactNode;
    onScroll?: (y: number) => void;
  };

const ScrollContainerHeader = ({
  TopLeftSection,
  TopRightSection,
  TopMiddleSection,
  MiddleSection,
  BottomSection,
  children,
  onScroll,
  ...props
}: ScrollContainerHeaderProps): JSX.Element => {
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler((event) => {
    currentPositionY.value = event.contentOffset.y;
    if (onScroll) onScroll(event.contentOffset.y);
  });

  return (
    <Animated.ScrollView
      {...props}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      stickyHeaderIndices={[0]}
    >
      <Header
        TopLeftSection={TopLeftSection}
        TopRightSection={TopRightSection}
        TopMiddleSection={TopMiddleSection}
        MiddleSection={MiddleSection}
        BottomSection={BottomSection}
        currentPositionY={currentPositionY}
      />
      {children}
    </Animated.ScrollView>
  );
};

export default ScrollContainerHeader;
