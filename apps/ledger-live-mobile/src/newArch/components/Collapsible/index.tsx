import React, { memo, ReactNode, useCallback, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import styled from "styled-components/native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/lib/components/Layout/Flex/index";

export default memo(Collapsible);

type Props = FlexBoxProps & {
  title: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
};

function Collapsible({ title, children, collapsed = false, ...titleContainerProps }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const collapseAnimation = useSharedValue(collapsed ? 0 : 1);

  const toggleCollapsed = useCallback(() => {
    const value = Math.round(collapseAnimation.value + 1) % 2;

    const { onStart, onDone }: { onStart?: () => void; onDone: () => void } =
      value === 0
        ? { onDone: () => setIsCollapsed(true) }
        : { onStart: () => setIsCollapsed(false), onDone: () => {} };

    onStart?.();

    collapseAnimation.value = withTiming(value, { duration: 200 }, finished => {
      if (finished) {
        runOnJS(onDone)();
      }
    });
  }, [collapseAnimation]);

  const animatedChevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${collapseAnimation.value * 90}deg` }],
  }));
  const animateContent = useAnimatedStyle(() => ({
    maxHeight: `${collapseAnimation.value * 100}%`,
  }));

  const header = typeof title === "string" ? <Text>{title}</Text> : title;

  return (
    <>
      <Flex {...titleContainerProps}>
        <Toggle activeOpacity={1} onPress={toggleCollapsed}>
          {header}
          <Animated.View style={animatedChevron}>
            <Icons.ChevronRight />
          </Animated.View>
        </Toggle>
      </Flex>

      <Animated.View style={[animateContent, { overflow: "hidden" }]}>
        {!isCollapsed && children}
      </Animated.View>
    </>
  );
}

const Toggle = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;
