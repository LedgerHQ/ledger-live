import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import React, { memo, useCallback } from "react";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import { track } from "~/analytics";
import { rgba } from "../../colors";

const StyledTouchableOpacity = styled(TouchableOpacity)<BaseStyledProps>`
  height: 32px;
  justify-content: center;
`;

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
  index: number;
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
        page: route.name,
      });
      navigation.navigate(route.name);
    }
  }, [isActive, navigation, route.key, route.name]);

  return (
    <StyledTouchableOpacity
      onPress={onPress}
      testID={`explore-tab-${route.name}`}
      borderRadius={2}
      px={4}
      mr={4}
      backgroundColor={isActive ? "primary.c70" : rgba(colors.constant.white, 0.05)}
    >
      <Text fontWeight={"semiBold"} variant={"body"} color={"neutral.c100"}>
        {label}
      </Text>
    </StyledTouchableOpacity>
  );
}

const MemoTab = memo(Tab);

const ExploreTabNavigatorTabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => (
  <Flex px={6} py={4} justifyContent={"flex-end"}>
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
          />
        );
      })}
    </Flex>
  </Flex>
);

export default memo(ExploreTabNavigatorTabBar);
