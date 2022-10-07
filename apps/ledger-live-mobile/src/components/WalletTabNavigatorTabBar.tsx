import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "styled-components/native";
import React, { memo, useCallback } from "react";
import styled from "@ledgerhq/native-ui/components/styled";
import { Flex, Text } from "@ledgerhq/native-ui";
import { track } from "../analytics";
import { rgba } from "../colors";

const TabBarContainer = styled(Flex)`
  border-bottom-width: 1px;
  border-bottom-color: ${p => p.theme.colors.palette.neutral.c40};
  background-color: transparent;
`;

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
      bg={isActive ? "primary.c70" : rgba(colors.constant.white, 0.08)}
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
  return (
    <TabBarContainer
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={4}
      paddingTop={4}
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
    </TabBarContainer>
  );
}

export default WalletTabNavigatorTabBar;
