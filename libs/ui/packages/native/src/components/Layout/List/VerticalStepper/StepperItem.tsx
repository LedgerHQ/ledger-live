import React, { useCallback } from "react";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import styled from "styled-components/native";
import { CheckAloneMedium } from "@ledgerhq/icons-ui/native";

import { Item, ItemStatus } from "../types";
import Flex from "../../Flex";
import Text from "../../../Text";
import ProgressLoader from "../../../Loader/ProgressLoader";

export type Props = {
  item: Item;
  progress?: number;
  nested?: boolean;
  isLastItem?: boolean;
  setActiveIndex?: (_: number) => void;
  index: number;
};

const Container = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean; nested?: boolean }>`
  flex: 1;
  border-bottom-width: ${(p) => (p.nested ? 0 : 1)}px;
  border-bottom-color: ${(p) =>
    p.isLastItem && p.status !== "inactive" ? "transparent" : p.theme.colors.neutral.c40};
`;

export default function StepperItem({
  item,
  progress,
  nested,
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
        <Container nested={nested} status={item.status} isLastItem={isLastItem}>
          <Flex
            px={nested ? 0 : 4}
            py={nested ? 4 : 7}
            flexDirection={nested ? "row-reverse" : "row"}
            justifyContent={nested ? "space-between" : "flex-start"}
          >
            <Flex width="28px" alignItems="center">
              {item.status === "completed" && <CheckAloneMedium size={20} color="success.c100" />}
              {item.status === "active" && (
                <ProgressLoader
                  progress={progress}
                  infinite={!progress}
                  radius={10}
                  strokeWidth={2}
                />
              )}
            </Flex>
            <Flex flex={1} ml={nested ? 0 : 4} mr={nested ? 0 : 2}>
              <Flex pb={item.status === "active" && item.renderBody ? 4 : undefined}>
                <Text
                  variant="body"
                  color={item.status === "active" || nested ? "neutral.c100" : "neutral.c80"}
                >
                  {item.status === "completed" ? item.doneTitle ?? item.title : item.title}
                </Text>
              </Flex>
              <Animated.ScrollView style={animatedStyle} showsVerticalScrollIndicator={false}>
                <Animated.View onLayout={handleLayout}>
                  {item.renderBody && item.status === "active" ? item.renderBody(true) : null}
                </Animated.View>
              </Animated.ScrollView>
            </Flex>
          </Flex>
        </Container>
      </Flex>
    </Pressable>
  );
}
