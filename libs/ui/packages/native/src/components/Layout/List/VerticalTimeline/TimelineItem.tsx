import React, { useCallback } from "react";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Theme } from "src/styles/theme";
import styled, { useTheme } from "styled-components/native";

import { Item, ItemStatus } from "../types";
import Flex from "../../Flex";
import Text from "../../../Text";
import Tag from "../../../tags/Tag";
import TimelineIndicator from "./TimelineIndicator";

export type Props = {
  item: Item;
  formatEstimatedTime?: (_: number) => string;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  setActiveIndex?: (_: number) => void;
  index: number;
  withExtraMarginOnActiveStep?: boolean;
};

const getContainerBackground = (theme: Theme, status: ItemStatus) => {
  if (status === "completed") {
    return "transparent";
  } else if (status === "active") {
    return theme.colors.neutral.c20;
  }
  return "transparent";
};

const getContainerBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (status === "completed") {
    return "transparent";
  } else if (isLastItem && status === "active") {
    return theme.colors.success.c100;
  } else if (status === "active") {
    return theme.colors.neutral.c40;
  }
  return "transparent";
};

const Container = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  flex: 1;
  border-radius: ${(p) => p.theme.radii[2]}px;
  background: ${(p) => getContainerBackground(p.theme, p.status)};
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
  withExtraMarginOnActiveStep,
}: Props) {
  const theme = useTheme();
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
          topHeight={
            withExtraMarginOnActiveStep && !isFirstItem && item.status === "active"
              ? TimelineIndicator.topSegmentDefaultHeight + theme.space[4]
              : undefined
          }
        />
        <Container
          status={item.status}
          isLastItem={isLastItem}
          mt={withExtraMarginOnActiveStep && !isFirstItem && item.status === "active" ? 4 : 0}
          mb={withExtraMarginOnActiveStep && !isLastItem && item.status === "active" ? 4 : 0}
        >
          <Flex flexDirection="row" justifyContent="space-between">
            <Text
              variant="body"
              fontWeight="semiBold"
              flexShrink={1}
              color={
                item.status === "completed" && isLastItem
                  ? "success.c80"
                  : item.status === "active"
                  ? "primary.c80"
                  : "neutral.c70"
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
