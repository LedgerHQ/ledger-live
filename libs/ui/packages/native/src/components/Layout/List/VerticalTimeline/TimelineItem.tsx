import React, { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { Theme } from "src/styles/theme";
import styled from "styled-components/native";

import { Item, ItemStatus } from ".";
import { Flex } from "../..";
import { Text } from "../../..";
import TimelineIndicator from "./TimelineIndicator";

export type Props = {
  item: Item;
  isFirstItem?: boolean;
  isLastItem?: boolean;
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

export default function TimelineItem({ item, isFirstItem, isLastItem }: Props) {
  const [height, setHeight] = useState(0);

  const transition = useDerivedValue(() => {
    return item.status === "active"
      ? withTiming(1, { duration: 300, easing: Easing.out(Easing.linear) })
      : withTiming(0, { duration: 300, easing: Easing.in(Easing.linear) });
  }, [item.status]);

  const handleLayoutChange = useCallback(
    (event: LayoutChangeEvent) => {
      if (height === 0 && event?.nativeEvent?.layout?.height > 0) {
        setHeight(event.nativeEvent.layout.height);
      }
    },
    [setHeight, height],
  );

  const style = useAnimatedStyle(
    () => ({
      height: transition.value * height + 1,
      overflow: "hidden",
    }),
    [height, transition.value],
  );

  return (
    <Flex flexDirection="row">
      <TimelineIndicator
        status={item.status}
        isFirstItem={isFirstItem}
        isLastItem={isLastItem}
        mr={4}
      />
      <Container status={item.status} isLastItem={isLastItem} mb={4}>
        <Text
          variant="body"
          color={
            item.status === "inactive" ? "neutral.c80" : isLastItem ? "success.c100" : "primary.c90"
          }
        >
          {item.title}
        </Text>
        <Animated.View style={style}>
          {item.renderBody && (
            <Flex position="relative">
              <Flex onLayout={handleLayoutChange} pt={6} position="absolute" opacity={0}>
                {item.renderBody(false)}
              </Flex>
              <Flex pt={6}>{item.renderBody(item.status === "active")}</Flex>
            </Flex>
          )}
        </Animated.View>
      </Container>
    </Flex>
  );
}
