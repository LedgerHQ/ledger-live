import React, { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated";
import styled from "styled-components/native";

import { Item, ItemStatus } from ".";
import { Flex } from "../..";
import { Text } from "../../..";
import StepIndicator from "./StepIndicator";

export type Props = {
  item: Item;
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

const Container = styled(Flex)<{ status: ItemStatus }>`
  flex: 1;
  border-radius: ${(p) => p.theme.radii[2]}px;
  background: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c10 : p.theme.colors.neutral.c20};
  border: 1px solid ${(p) => (p.status === "active" ? p.theme.colors.primary.c80 : "transparent")};
  padding: 20px 16px;
`;

export default function StepListItemWrapper({ item, isFirstItem, isLastItem }: Props) {
  const [height, setHeight] = useState(0);

  const transition = useDerivedValue(() => {
    return item.status === "active" ? withTiming(1) : withTiming(0);
  }, [item.status]);

  const handleLayoutChange = useCallback(
    (event: LayoutChangeEvent) => {
      setHeight(event.nativeEvent.layout.height);
    },
    [setHeight],
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
      <StepIndicator
        status={item.status}
        hideTopSegment={isFirstItem}
        hideBottomSegment={isLastItem}
        mr={4}
      />
      <Container status={item.status} mb={6}>
        <Text variant="body" color={item.status === "inactive" ? "neutral.c70" : "primary.c90"}>
          {item.title}
        </Text>
        <Animated.View style={style}>
          <Flex onLayout={handleLayoutChange}>
            {item.renderBody && <Flex pt={6}>{item.renderBody()}</Flex>}
          </Flex>
        </Animated.View>
      </Container>
    </Flex>
  );
}
