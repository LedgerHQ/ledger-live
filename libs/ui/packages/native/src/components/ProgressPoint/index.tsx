import React from "react";
import styled from "styled-components/native";
import Flex, { FlexBoxProps } from "../Layout/Flex";
import Animated, { useDerivedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import Box from "../Layout/Box";

export interface PointProgressProps extends FlexBoxProps {
  start: number;
  end: number;
  current: number;
}

const Container = styled(Flex)`
  width: 100%;
  position: relative;
`;

const Point = styled(Box)`
  position: absolute;
  width: 4px;
  height: 9px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.primary.c100};
`;
const AnimatedPoint = Animated.createAnimatedComponent(Point);

export function ProgressPoint({ start = 0, end = 100, current = 0, ...props }: PointProgressProps) {
  const percentage = useDerivedValue(() => {
    const range = end - start;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(100, ((current - start) / range) * 100));
  }, [start, end, current]);

  const animatedPointStyle = useAnimatedStyle(() => ({
    left: withTiming(`${percentage.value}%`, { duration: 300 }),
    transform: [{ translateX: -6 }],
  }));

  return (
    <Container height={9} bg="neutral.c40" borderRadius={4} {...props}>
      <AnimatedPoint style={animatedPointStyle} />
    </Container>
  );
}

export default React.memo(ProgressPoint);
