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

function ActiveProgressBar({
  duration,
  containerWidth = 0,
}: StoryBarProps & { containerWidth?: number }) {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = 0;
    if (containerWidth > 0) {
      animatedWidth.value = withTiming(containerWidth, {
        duration: duration || 200,
        easing: Easing.linear,
      });
    }
  }, [containerWidth, duration, animatedWidth]);

  const animatedStyles = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  return <AnimatedProgressBar style={animatedStyles} />;
}

function StoryBar({ full = false, isActive, duration }: StoryBarProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);

  function renderProgressBar() {
    if (isActive) {
      return <ActiveProgressBar duration={duration} containerWidth={containerWidth} />;
    }
    if (full) {
      return <ProgressBar />;
    }
    return null;
  }

  return (
    <Flex
      height={4}
      backgroundColor="neutral.c50"
      margin={"auto"}
      borderRadius={2}
      flex={1}
      mx={1}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {renderProgressBar()}
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
      pointerEvents="none"
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
