import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "styled-components/native";
import React, { memo, useCallback, useContext } from "react";
import styled from "@ledgerhq/native-ui/components/styled";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Animated } from "react-native";
import { track } from "../../analytics";
import { rgba } from "../../colors";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

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
}: MaterialTopTabBarProps) {
  const { scrollY, headerHeight, tabBarHeight } = useContext(
    WalletTabNavigatorScrollContext,
  );

  const y = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [headerHeight, 0],
    extrapolateRight: "clamp",
  });

  return (
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
      <Flex
        flex={1}
        px={6}
        pb={4}
        justifyContent={"flex-end"}
        bg={"background.main"}
      >
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
  );
}

export default memo(WalletTabNavigatorTabBar);
