import React, { useCallback, useState } from "react";
import styled from "styled-components/native";
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from "react-native-reanimated";

import Flex from "../Flex";
import { LayoutChangeEvent } from "react-native";

export type HeaderProps = {
  TopLeftSection?: JSX.Element;
  TopMiddleSection?: JSX.Element;
  TopRightSection?: JSX.Element;
  MiddleSection?: JSX.Element;
  BottomSection?: JSX.Element;
  currentPositionY: Animated.SharedValue<number>;
};

const PADDING_HORIZONTAL = 16;

const Container = styled(Flex).attrs({
  paddingHorizontal: PADDING_HORIZONTAL,
})`
  background-color: ${(p) => p.theme.colors.background.main};
  width: 100%;
`;

const SCROLL_BREAKPOINT = 80;

const Header = ({
  TopLeftSection,
  TopRightSection,
  TopMiddleSection,
  MiddleSection,
  BottomSection,
  currentPositionY,
}: HeaderProps): JSX.Element => {
  const [topSectionHeight, setTopSectionHeight] = useState(0);
  const [topSectionWidth, setTopSectionWidth] = useState(0);
  const [topMiddleWidth, setTopMiddleWidth] = useState(0);
  const [topLeftWidth, setTopLeftWidth] = useState(0);
  const [middleWidth, setMiddleWidth] = useState(0);

  const onLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setTopSectionHeight(layout.height);
    setTopSectionWidth(layout.width);
  }, []);

  const onLayoutTopLeft = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setTopLeftWidth(layout.width);
  }, []);

  const onLayoutTopMiddle = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setTopMiddleWidth(layout.width);
  }, []);

  const onLayoutMiddle = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setMiddleWidth(layout.width);
  }, []);

  const TopMiddleStyle = useAnimatedStyle(() => {
    const scaleRatio = middleWidth ? Math.min(topMiddleWidth / middleWidth, 0.9) : 0.7;

    /** scale the animated content to fit in the available space on the top header section */
    const scale = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [1, scaleRatio],
      Extrapolate.CLAMP,
    );

    /** offset horizontaly given the scale transformation and potential top left header section */
    const translateX = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [0, -(topMiddleWidth - topMiddleWidth * scaleRatio) / 2],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      currentPositionY.value,
      [SCROLL_BREAKPOINT - 1, SCROLL_BREAKPOINT + 40],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ translateX }, { scale }],
      flex: 1,
      opacity,
      justifyContent: "center", // needed to ensure vertical centering of animated content
    };
  }, [topLeftWidth, topSectionHeight, middleWidth, topMiddleWidth, topSectionWidth]);

  const MiddleStyle = useAnimatedStyle(() => {
    const scaleRatio = middleWidth ? Math.min(topMiddleWidth / middleWidth, 0.9) : 0.7;

    /** scale the animated content to fit in the available space on the top header section */
    const scale = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [1, scaleRatio],
      Extrapolate.CLAMP,
    );
    /** translate verticaly to the middle of the top header section */
    const translateY = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [0, -topSectionHeight + topSectionHeight / 2],
      Extrapolate.CLAMP,
    );
    /** offset horizontaly given the scale transformation and potential top left header section */
    const translateX = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [0, -(topSectionWidth - topSectionWidth * scaleRatio) / 2 + topLeftWidth],
      Extrapolate.CLAMP,
    );
    /** allow for content to move upward as animation is taking place */
    const maxHeight = interpolate(
      currentPositionY.value,
      [0, SCROLL_BREAKPOINT],
      [70, 0],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      currentPositionY.value,
      [SCROLL_BREAKPOINT - 1, SCROLL_BREAKPOINT + 40],
      [1, 0],
      Extrapolate.CLAMP,
    );

    return {
      maxHeight,
      transform: [{ translateY }, { translateX }, { scale }],
      opacity,
      justifyContent: "center", // needed to ensure vertical centering of animated content
    };
  }, [topLeftWidth, topSectionHeight, middleWidth, topMiddleWidth, topSectionWidth]);

  return (
    <Container>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        onLayout={onLayout}
      >
        <Flex onLayout={onLayoutTopLeft}>{TopLeftSection}</Flex>
        <Animated.View
          style={[TopMiddleStyle]}
          onLayout={topMiddleWidth ? () => {} : onLayoutTopMiddle}
        >
          {TopMiddleSection || MiddleSection}
        </Animated.View>
        {TopRightSection}
      </Flex>
      <Animated.View onLayout={middleWidth ? () => {} : onLayoutMiddle} style={MiddleStyle}>
        {MiddleSection}
      </Animated.View>
      {BottomSection ? <Flex>{BottomSection}</Flex> : null}
    </Container>
  );
};

Header.PADDING_HORIZONTAL = PADDING_HORIZONTAL;

export default Header;
