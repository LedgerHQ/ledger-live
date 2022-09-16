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
import { I18nManager } from "react-native";

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

const ProgressBar = styled.View`
  background-color: ${(p) => p.theme.colors.primary.c100};
  border-radius: ${(p) => p.theme.radii[2]}px;
  height: 100%;
  width: 100%;
`;

const AnimatedProgressBar = Animated.createAnimatedComponent(ProgressBar);

function ActiveProgressBar({ duration }: StoryBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = 100;
  }, [width]);

  const animatedStyles = useAnimatedStyle(
    () => ({
      width: withTiming(`${width.value}%`, {
        duration: duration || 200,
        easing: Easing.linear,
      }),
    }),
    [width, duration],
  );

  return <AnimatedProgressBar style={animatedStyles} />;
}

function StoryBar({ full = false, isActive, duration }: StoryBarProps) {
  return (
    <Flex height={4} backgroundColor="neutral.c50" margin={"auto"} borderRadius={2} flex={1} mx={1}>
      {isActive ? <ActiveProgressBar duration={duration} /> : full ? <ProgressBar /> : null}
    </Flex>
  );
}

function StoriesIndicator({ activeIndex, slidesLength, duration }: StoriesIndicatorProps) {
  const storiesArray = useMemo(() => new Array(slidesLength).fill(0), [slidesLength]);
  return (
    <Flex
      flexDirection={"row"}
      alignItems={"stretch"}
      width={"100%"}
      style={
        I18nManager.isRTL
          ? {
              transform: [{ scaleX: -1 }],
            }
          : undefined
      }
    >
      {storiesArray.map((_, storyIndex) => (
        <StoryBar
          key={storyIndex}
          full={activeIndex > storyIndex}
          isActive={activeIndex === storyIndex}
          duration={duration}
        />
      ))}
    </Flex>
  );
}

export default React.memo(StoriesIndicator);
