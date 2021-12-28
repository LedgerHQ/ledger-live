import React from "react";
import { FlatListProps, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

import Header from "./Header";
import type { HeaderProps } from "./Header";
import baseStyled, { BaseStyledProps } from "../../styled";

const StyledFlatList = baseStyled.FlatList<BaseStyledProps>``;

const AnimatedFlatList: any = Animated.createAnimatedComponent(StyledFlatList);

type ScrollContainerHeaderProps = BaseStyledProps &
  Omit<HeaderProps, "currentPositionY"> &
  Omit<FlatListProps<any>, "onScroll" | "data" | "renderItem" | "stickyHeaderIndices"> & {
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
    <AnimatedFlatList
      {...props}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      stickyHeaderIndices={[0]}
      data={[
        <Header
          TopLeftSection={TopLeftSection}
          TopRightSection={TopRightSection}
          TopMiddleSection={TopMiddleSection}
          MiddleSection={MiddleSection}
          BottomSection={BottomSection}
          currentPositionY={currentPositionY}
        />,
        children,
      ]}
      renderItem={({ item, index }: { item: React.ReactNode; index: number }) => (
        <View key={index}>{item}</View>
      )}
    ></AnimatedFlatList>
  );
};

export default ScrollContainerHeader;
