import React, { useEffect, useMemo } from "react";
import styled from "styled-components/native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import { FlexBoxProps } from "../../Layout/Flex";
import { Flex } from "../../Layout";

export interface StoryBarProps {
  /**
   * Is this step active.
   */
  isActive?: boolean;
  /**
   * Has this step been completed.
   */
  full?: boolean;
  /**
   * The duration of this step.
   */
  duration?: number;
}

export interface StoriesIndicatorProps extends FlexBoxProps {
  /**
   * The index of the active step.
   */
  activeIndex: number;
  /**
   * The total number of steps.
   */
  slidesLength: number;
  onChange?: (index: number) => void;
  /**
   * The duration of each step.
   */
  duration?: number;
}

const ActiveBar = styled.View<{ full?: boolean }>`
  background-color: ${(p) => p.theme.colors.primary.c100};
  height: 100%;
  width: 100%;
  border-radius: 8px;
`;

const AnimatedBar = Animated.createAnimatedComponent(ActiveBar);

export const TabsContainer = styled(Flex).attrs({
  // Avoid conflict with styled-system's size property by nulling size and renaming it
  size: undefined,
  flexDirection: "row",
  alignItems: "stretch",
})`
  width: 100%;
`;

function StoryBar({ full = false, isActive, duration }: StoryBarProps) {
  const width = useSharedValue(full ? 100 : 0);

  useEffect(() => {
    if (isActive) {
      width.value = 100;
    } else if (full) {
      width.value = 0;
    } else {
      width.value = 0;
    }
  }, [isActive, full, width]);

  const animatedStyles = useAnimatedStyle(
    () => ({
      width: withTiming(`${width.value}%`, {
        duration: isActive ? duration || 200 : 0,
        easing: duration ? Easing.linear : Easing.linear,
      }),
    }),
    [isActive, duration, full],
  );

  return (
    <Flex
      height={4}
      backgroundColor="neutral.c50"
      margin={"auto"}
      borderRadius={"8px"}
      flex={1}
      mx={1}
    >
      {full ? <ActiveBar /> : <AnimatedBar style={animatedStyles} />}
    </Flex>
  );
}

function StoriesIndicator({ activeIndex, slidesLength, duration }: StoriesIndicatorProps) {
  const storiesArray = useMemo(() => new Array(slidesLength).fill(0), [slidesLength]);
  return (
    <TabsContainer>
      {storiesArray.map((_, storyIndex) => (
        <StoryBar
          full={activeIndex > storyIndex}
          isActive={activeIndex === storyIndex}
          duration={duration}
        />
      ))}
    </TabsContainer>
  );
}

export default React.memo(StoriesIndicator);
