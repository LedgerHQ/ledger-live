import React from "react";
import { FlatList, FlatListProps, ScrollViewProps, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

import Flex from "../Flex";
import Header from "./Header";
import type { HeaderProps } from "./Header";
import baseStyled, { BaseStyledProps } from "../../styled";

const StyledFlatList = baseStyled(FlatList)<BaseStyledProps>``;

const AnimatedFlatList = Animated.createAnimatedComponent(StyledFlatList);

type ScrollContainerHeaderProps<ItemType> = BaseStyledProps &
  Omit<HeaderProps, "currentPositionY"> &
  Omit<FlatListProps<ItemType>, "onScroll" | "data" | "renderItem"> & {
    children?: React.ReactNode;
    onScroll?: (y: number) => void;
    containerProps?: BaseStyledProps;
  } & Pick<ScrollViewProps, "stickyHeaderIndices">;

const ScrollContainerHeader = <ItemType,>({
  TopLeftSection,
  TopRightSection,
  TopMiddleSection,
  MiddleSection,
  BottomSection,
  children,
  onScroll,
  containerProps,
  ...props
}: ScrollContainerHeaderProps<ItemType>): JSX.Element => {
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler((event) => {
    currentPositionY.value = event.contentOffset.y;
    if (onScroll) onScroll(event.contentOffset.y);
  });

  return (
    <Flex flex={1} {...containerProps}>
      <Header
        TopLeftSection={TopLeftSection}
        TopRightSection={TopRightSection}
        TopMiddleSection={TopMiddleSection}
        MiddleSection={MiddleSection}
        BottomSection={BottomSection}
        currentPositionY={currentPositionY}
      />
      <AnimatedFlatList
        {...props}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={[...React.Children.toArray(children)]}
        renderItem={({ item }: { item: React.ReactNode }) => <View>{item}</View>}
        keyExtractor={(_: unknown, index: number) => index.toString()}
      ></AnimatedFlatList>
    </Flex>
  );
};

ScrollContainerHeader.Header = Header;

export default ScrollContainerHeader;
