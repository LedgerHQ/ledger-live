import React, { useCallback, useState } from "react";
import { View } from "react-native";
import styled from "styled-components/native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

import Flex from "../Flex";

export type HeaderProps = {
  TopLeftSection?: JSX.Element;
  TopMiddleSection?: JSX.Element;
  TopRightSection?: JSX.Element;
  MiddleSection?: JSX.Element;
  BottomSection?: JSX.Element;
  currentPositionY: Animated.SharedValue<number>;
};

const Container = styled(Flex).attrs({
  paddingHorizontal: 16,
})`
  background-color: ${(p) => p.theme.colors.palette.background.main};
  width: 100%;
`;

const SCROLL_BREAKPOINT = 80;

const Header = ({
  TopLeftSection,
  TopRightSection,
  MiddleSection,
  BottomSection,
  currentPositionY,
}: HeaderProps): JSX.Element => {
  const [topSectionHeight, setTopSectionHeight] = useState(0);
  const [topSectionWidth, setTopSectionWidth] = useState(0);
  const [topMiddleWidth, setTopMiddleWidth] = useState(0);
  const [topLeftWidth, setTopLeftWidth] = useState(0);
  const [middleWidth, setMiddleWidth] = useState(0);

  const onLayout = useCallback(({ nativeEvent: { layout } }) => {
    setTopSectionHeight(layout.height);
    setTopSectionWidth(layout.width);
  }, []);

  const onLayoutTopLeft = useCallback(({ nativeEvent: { layout } }) => {
    setTopLeftWidth(layout.width);
  }, []);

  const onLayoutTopMiddle = useCallback(({ nativeEvent: { layout } }) => {
    setTopMiddleWidth(layout.width);
  }, []);

  const onLayoutMiddle = useCallback(({ nativeEvent: { layout } }) => {
    setMiddleWidth(layout.width);
  }, []);

  const MiddleStyle = useAnimatedStyle(() => {
    const scaleRatio = middleWidth
      ? Math.min(topMiddleWidth / middleWidth, 0.9)
      : 0.7;

    /** scale the animated content to fit in the available space on the top header section */
    const scale = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [1, scaleRatio],
      Extrapolate.CLAMP
    );
    /** translate verticaly to the middle of the top header section */
    const translateY = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [0, -topSectionHeight + topSectionHeight / 2],
      Extrapolate.CLAMP
    );
    /** offset horizontaly given the scale transformation and potential top left header section */
    const translateX = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [0, -(topSectionWidth - topMiddleWidth) / 2 + topLeftWidth],
      Extrapolate.CLAMP
    );
    /** allow for content to move upward as animation is taking place */
    const maxHeight = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [70, 0],
      Extrapolate.CLAMP
    );

    return {
      maxHeight,
      transform: [{ translateY }, { translateX }, { scale }],
      justifyContent: "center", // needed to ensure vertical centering of animated content
    };
  }, [
    topLeftWidth,
    topSectionHeight,
    middleWidth,
    topMiddleWidth,
    topSectionWidth,
  ]);

  return (
    <Container>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        onLayout={onLayout}
      >
        <View onLayout={onLayoutTopLeft}>{TopLeftSection}</View>
        <Flex flex={1} onLayout={onLayoutTopMiddle} />
        {TopRightSection}
      </Flex>
      <Animated.View
        onLayout={middleWidth ? () => {} : onLayoutMiddle}
        style={MiddleStyle}
      >
        {MiddleSection}
      </Animated.View>
      {BottomSection ? <Flex>{BottomSection}</Flex> : null}
    </Container>
  );
};

export default Header;
