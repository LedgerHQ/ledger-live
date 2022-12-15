import React, { useCallback } from "react";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Theme } from "src/styles/theme";
import styled from "styled-components/native";

import { Item, ItemStatus } from ".";
import { Flex } from "../..";
import { Text, Tag } from "../../..";
import TimelineIndicator from "./TimelineIndicator";

export type Props = {
  item: Item;
  formatEstimatedTime?: (_: number) => string;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  setActiveIndex?: (_: number) => void;
  index: number;
};

const getContainerBackground = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem && status === "completed") {
    return theme.colors.success.c30;
  } else if (status === "completed") {
    return theme.colors.primary.c20;
  } else if (status === "active") {
    return theme.colors.neutral.c20;
  }
  return theme.colors.neutral.c30;
};

const getContainerBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem && status === "completed") {
    return theme.colors.success.c30;
  } else if (isLastItem && status === "active") {
    return theme.colors.success.c100;
  } else if (status === "completed") {
    return theme.colors.primary.c20;
  } else if (status === "active") {
    return theme.colors.primary.c80;
  }
  return theme.colors.neutral.c30;
};

const Container = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  flex: 1;
  border-radius: ${(p) => p.theme.radii[2]}px;
  background: ${(p) => getContainerBackground(p.theme, p.status, p.isLastItem)};
  border: 1px solid ${(p) => getContainerBorder(p.theme, p.status, p.isLastItem)};
  padding: 20px 16px;
`;

export default function TimelineItem({
  item,
  formatEstimatedTime,
  isFirstItem,
  isLastItem,
  setActiveIndex,
  index,
}: Props) {
  /**
   * Having an initial value of null will prevent having "height: 0" before the
   * initial call of onLayout.
   * The component will just layout normally without an animation which is ok
   * since this will happen only on the first step.
   * Without this default behavior, there are issues on iOS where sometimes the
   * height is stuck at 0.
   */
  const sharedHeight = useSharedValue<number | null>(null);
  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }) => {
      sharedHeight.value = withTiming(layout.height, { duration: 300 });
    },
    [sharedHeight],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      /**
       * If it's null the component still renders normally at its full height
       * without its height being derived from an animated value.
       */
      height: sharedHeight.value ?? undefined,
    }),
    [],
  );

  const handlePress = useCallback(() => {
    setActiveIndex && setActiveIndex(index);
  }, [setActiveIndex, index]);

  return (
    <Pressable onPress={handlePress}>
      <Flex flexDirection="row">
        <TimelineIndicator
          status={item.status}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          mr={4}
        />
        <Container status={item.status} isLastItem={isLastItem} mb={4}>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text
              variant="body"
              flexShrink={1}
              color={
                item.status === "inactive"
                  ? "neutral.c80"
                  : isLastItem
                  ? "success.c100"
                  : "primary.c90"
              }
            >
              {item.status === "completed" ? item.doneTitle ?? item.title : item.title}
            </Text>
            {item?.estimatedTime && item.status === "active" && (
              <Tag>
                {formatEstimatedTime
                  ? formatEstimatedTime(item.estimatedTime)
                  : `${item.estimatedTime / 60} min`}
              </Tag>
            )}
          </Flex>
          <Animated.ScrollView style={animatedStyle} showsVerticalScrollIndicator={false}>
            <Animated.View onLayout={handleLayout}>
              {item.renderBody && item.status === "active" ? (
                <Flex pt={6}>{item.renderBody(true)}</Flex>
              ) : null}
            </Animated.View>
          </Animated.ScrollView>
        </Container>
      </Flex>
    </Pressable>
  );
}
