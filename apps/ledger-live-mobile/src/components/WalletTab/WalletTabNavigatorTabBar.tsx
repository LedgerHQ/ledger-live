import { Box, Flex, Text } from "@ledgerhq/native-ui";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import React, { memo, useCallback, useContext, useMemo } from "react";
import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "~/context/store";
import { useTheme } from "styled-components/native";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import WalletTabBackgroundGradient from "./WalletTabBackgroundGradient";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import { useExperimental } from "~/experimental";

const StyledTouchableOpacity = styled.TouchableOpacity`
  height: 32px;
  justify-content: center;
  margin-right: ${p => p.theme.space[4]}px;
`;

const StyledAnimatedView = styled(Animated.View).attrs({ pointerEvents: "none" })<BaseStyledProps>`
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
}: {
  route: { name: string; key: string };
  label?: string;
  isActive: boolean;
  navigation: MaterialTopTabBarProps["navigation"];
}) {
  const { colors } = useTheme();

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

  return (
    <StyledTouchableOpacity onPress={onPress} testID={`wallet-tab-${route.name}`}>
      <StyledAnimatedView
        borderRadius={2}
        style={{
          backgroundColor: isActive ? colors.neutral.c100 : colors.opacityDefault.c10,
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

function WalletTabNavigatorTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const { colors } = useTheme();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasNoAccounts = useSelector(hasNoAccountsSelector);

  const { scrollY, headerHeight, tabBarHeight } = useContext(WalletTabNavigatorScrollContext);

  const translateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [headerHeight, 0],
        extrapolateRight: "clamp",
      }),
    [headerHeight, scrollY],
  );

  const opacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [headerHeight, headerHeight + 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [headerHeight, scrollY],
  );
  const insets = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();

  return (
    <>
      <WalletTabBackgroundGradient
        color={readOnlyModeEnabled && hasNoAccounts ? colors.neutral.c30 : undefined}
      />
      <AnimatedFlex
        style={{
          top: hasExperimentalHeader ? 0 : insets.top,
          zIndex: 1,
          position: "absolute",
          transform: [{ translateY }],
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
        <Flex px={6} py={4} justifyContent={"flex-end"}>
          <Flex flexDirection={"row"}>
            {state.routes.map((route, index) => (
              <MemoTab
                key={route.key}
                route={route}
                label={descriptors[route.key]?.options.title}
                isActive={state.index === index}
                navigation={navigation}
              />
            ))}
          </Flex>
        </Flex>
      </AnimatedFlex>
    </>
  );
}

export default memo(WalletTabNavigatorTabBar);
