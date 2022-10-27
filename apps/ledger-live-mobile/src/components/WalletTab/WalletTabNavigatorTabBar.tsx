import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "styled-components/native";
import React, { memo, useCallback, useContext, useMemo } from "react";
import styled from "@ledgerhq/native-ui/components/styled";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Animated } from "react-native";
import { useSelector } from "react-redux";
import { track } from "../../analytics";
import { rgba } from "../../colors";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import WalletTabBackgroundGradient from "./WalletTabBackgroundGradient";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { pairId } from "../../../../../libs/ledger-live-common/lib-es/countervalues/helpers";
import { accountsSelector } from "../../reducers/accounts";

const StyledTab = styled.TouchableOpacity``;

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
        tab: route.name,
      });
      navigation.navigate(route.name);
    }
  }, [isActive, navigation, route.key, route.name]);

  return (
    <StyledTab
      backgroundColor={
        isActive ? "primary.c70" : rgba(colors.constant.white, 0.08)
      }
      borderRadius={2}
      px={4}
      py={3}
      mr={4}
      onPress={onPress}
    >
      <Text fontWeight={"semiBold"} variant={"body"} color={"neutral.c100"}>
        {label}
      </Text>
    </StyledTab>
  );
}

const MemoTab = memo(Tab);

function WalletTabNavigatorTabBar({
  state,
  descriptors,
  navigation,
  position,
}: MaterialTopTabBarProps) {
  const { colors } = useTheme();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accounts = useSelector(accountsSelector);

  const { scrollY, headerHeight, tabBarHeight } = useContext(
    WalletTabNavigatorScrollContext,
  );

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

  return (
    <>
      <WalletTabBackgroundGradient
        scrollX={position}
        color={
          readOnlyModeEnabled && accounts.length <= 0
            ? colors.neutral.c30
            : undefined
        }
      />
      <Animated.View
        style={{
          top: 0,
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
            // transform: [{ translateY: y }],
            width: "100%",
            height: tabBarHeight,
            backgroundColor: colors.background.main,
            opacity,
          }}
        />
        <Flex flex={1} px={6} pb={4} justifyContent={"flex-end"}>
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
                />
              );
            })}
          </Flex>
        </Flex>
      </Animated.View>
    </>
  );
}

export default memo(WalletTabNavigatorTabBar);
