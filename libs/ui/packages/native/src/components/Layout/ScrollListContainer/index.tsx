import React, { forwardRef } from "react";
import {
  View,
  FlatListProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
} from "react-native";
import Animated from "react-native-reanimated";
import baseStyled, { BaseStyledProps } from "../../styled";

const StyledFlatList = baseStyled.FlatList<BaseStyledProps>``;
const AnimatedFlatList: any = Animated.createAnimatedComponent(StyledFlatList);

type ScrollListContainerProps = BaseStyledProps &
  Omit<FlatListProps<any>, "onScroll" | "data" | "renderItem"> & {
    children: React.ReactNode;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    horizontal?: boolean;
  };

/*
 ** This Layout is a wrapper for FlatList that accepts
 ** complex onScroll callback for react-native-reanimated.
 */
const ScrollListContainer = forwardRef<FlatList, ScrollListContainerProps>(
  ({ children, onScroll, horizontal = false, ...props }, ref) => {
    return (
      <AnimatedFlatList
        ref={ref}
        data={[...React.Children.toArray(children)]}
        renderItem={({ item }: { item: React.ReactNode }) => <View>{item}</View>}
        onScroll={onScroll}
        horizontal={horizontal}
        {...props}
      />
    );
  },
);

export default ScrollListContainer;
