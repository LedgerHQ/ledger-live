import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "styled-components/native";
import React, { memo, useCallback, useContext } from "react";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { Animated } from "react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { track } from "~/analytics";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import WalletTabBackgroundGradient from "./WalletTabBackgroundGradient";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";

const StyledTouchableOpacity = styled.TouchableOpacity`
  height: 32px;
  justify-content: center;
  margin-right: ${p => p.theme.space[4]}px;
`;

const StyledAnimatedView = styled(Animated.View)<BaseStyledProps>`
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
`;

function getAnalyticsEvent(route: string) {
  switch (route) {
    case NavigatorName.Market:
      return "Market";
    case ScreenName.Portfolio:
    default:
      return "Crypto";
  }
}

function Tab({
  route,
  label,
  isActive,
  navigation,
  index,
  scrollX,
}: {
  route: { name: string; key: string };
  label?: string;
  isActive: boolean;
  navigation: MaterialTopTabBarProps["navigation"];
  index: number;
  scrollX: MaterialTopTabBarProps["position"];
}) {
  const { colors } = useTheme();

  const opacity = scrollX.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  const onPress = useCallback(() => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isActive && !event.defaultPrevented) {
      track("tab_clicked", {
        tab: getAnalyticsEvent(route.name),
      });
      navigation.navigate(route.name);
    }
  }, [isActive, navigation, route]);

  const backgroundColor = opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.opacityDefault.c10, colors.neutral.c100],
  });

  return (
    <StyledTouchableOpacity onPress={onPress} testID={`wallet-tab-${route.name}`}>
      <StyledAnimatedView
        borderRadius={2}
        style={{
          backgroundColor,
          opacity: 1,
        }}
      />
      <Box borderRadius={2} px={4}>
        <Text
          fontWeight={"semiBold"}
          variant={"body"}
          color={isActive ? "neutral.c00" : "neutral.c100"}
        >
          {label}
        </Text>
      </Box>
    </StyledTouchableOpacity>
  );
}

const MemoTab = memo(Tab);

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

function WalletTabNavigatorTabBar({
  state,
  descriptors,
  navigation,
  position,
}: MaterialTopTabBarProps) {
  const { colors } = useTheme();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasNoAccounts = useSelector(hasNoAccountsSelector);

  const { scrollY, headerHeight, tabBarHeight } = useContext(WalletTabNavigatorScrollContext);

  const y = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [headerHeight, 0],
    extrapolateRight: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange: [headerHeight, headerHeight + 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const insets = useSafeAreaInsets();

  return (
    <>
      <WalletTabBackgroundGradient
        scrollX={position}
        color={readOnlyModeEnabled && hasNoAccounts ? colors.neutral.c30 : undefined}
      />
      <AnimatedFlex
        style={{
          top: insets.top,
          zIndex: 1,
          position: "absolute",
          transform: [{ translateY: y }],
          width: "100%",
          height: tabBarHeight,
        }}
      >
        <Animated.View
          style={{
            top: 0,
            position: "absolute",
            width: "100%",
            height: tabBarHeight,
            backgroundColor: colors.background.main,
            opacity,
          }}
        />
        <Flex px={6} py={2} justifyContent={"flex-end"}>
          <Flex flexDirection={"row"}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              return (
                <MemoTab
                  key={index}
                  route={route}
                  label={options.title}
                  isActive={state.index === index}
                  navigation={navigation}
                  index={index}
                  scrollX={position}
                />
              );
            })}
          </Flex>
        </Flex>
      </AnimatedFlex>
    </>
  );
}

export default memo(WalletTabNavigatorTabBar);
