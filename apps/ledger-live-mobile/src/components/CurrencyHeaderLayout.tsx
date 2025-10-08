import React from "react";
import { Box, Flex } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";

import getWindowDimensions from "~/logic/getWindowDimensions";
import CurrencyGradient from "./CurrencyGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const windowsWidth = getWindowDimensions().width;

function CurrencyHeaderLayout({
  currentPositionY,
  graphCardEndPosition,
  rightElement,
  centerAfterScrollElement,
  centerBeforeScrollElement,
  leftElement,
  currencyColor,
}: {
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  rightElement?: React.ReactNode;
  centerAfterScrollElement?: React.ReactNode;
  centerBeforeScrollElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  currencyColor: string;
}) {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 50;
  const BeforeScrollAnimation = useAnimatedStyle(() => {
    const opacity =
      currentPositionY.value === 0
        ? 1
        : interpolate(
            currentPositionY.value,
            [graphCardEndPosition - 40, graphCardEndPosition],
            [1, 0],
            Extrapolation.CLAMP,
          );

    return {
      opacity,
    };
  }, [currentPositionY, graphCardEndPosition]);

  const AfterScrollAnimation = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 50, graphCardEndPosition + 70],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
    };
  }, [currentPositionY, graphCardEndPosition]);

  const BackgroundOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition - 40, graphCardEndPosition - 20],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
    };
  }, [currentPositionY, graphCardEndPosition]);

  return (
    <Header
      flexDirection="row"
      alignItems="center"
      px={6}
      py={4}
      justifyContent="space-between"
      width={windowsWidth}
      height={headerHeight}
      pt={insets.top}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: windowsWidth,
            height: headerHeight,
            overflow: "hidden",
          },
          BackgroundOpacity,
        ]}
      >
        <Box height={"100%"} width={windowsWidth}>
          <CurrencyGradient gradientColor={currencyColor} />
        </Box>
      </Animated.View>
      <Box>{leftElement}</Box>
      <CenteredElement>
        <Animated.View style={[{ position: "absolute" }, AfterScrollAnimation]}>
          {centerAfterScrollElement}
        </Animated.View>
        <Animated.View style={[{ position: "absolute" }, BeforeScrollAnimation]}>
          {centerBeforeScrollElement}
        </Animated.View>
      </CenteredElement>
      <Box>{rightElement}</Box>
    </Header>
  );
}

export default CurrencyHeaderLayout;

const Header = styled(Flex)`
  position: absolute;
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const CenteredElement = styled(Flex)`
  position: relative;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 48px;
  flex: 1;
`;
