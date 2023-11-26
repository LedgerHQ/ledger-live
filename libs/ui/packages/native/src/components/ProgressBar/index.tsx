import React from "react";
import styled from "styled-components/native";
import Flex, { FlexBoxProps } from "../Layout/Flex";
import Animated, { useDerivedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { BaseStyledProps } from "../styled";
import Box from "../Layout/Box";

export interface Props extends FlexBoxProps {
  /**
   * The index of the active step.
   */
  index: number;
  /**
   * The total number of steps.
   */
  length: number;
  /**
   * Style props for the bar element.
   */
  activeBarProps?: BaseStyledProps;
}

const ActiveBar = styled(Box)`
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
`;
const AnimatedBar = Animated.createAnimatedComponent(ActiveBar);

function ProgressBar({ index, length, activeBarProps, ...props }: Props) {
  const width = useDerivedValue(() => Math.round((index / (length - 1)) * 100), [index, length]);

  const animatedStyles = useAnimatedStyle(() => ({
    width: withTiming(`${width.value}%`),
  }));

  return (
    <Flex height={4} width="100%" backgroundColor="neutral.c20" position="relative" {...props}>
      <AnimatedBar style={[animatedStyles]} bg={"neutral.c100"} {...activeBarProps} />
    </Flex>
  );
}

export default React.memo(ProgressBar);
