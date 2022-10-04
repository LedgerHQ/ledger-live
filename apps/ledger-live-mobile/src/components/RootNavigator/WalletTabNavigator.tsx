import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import styled from "@ledgerhq/native-ui/components/styled";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { ScreenName } from "../../const";
import Portfolio from "../../screens/Portfolio";
import WalletNftGallery from "../../screens/Nft/WalletNftGallery";
import { rgba } from "../../colors";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { accountsSelector } from "../../reducers/accounts";
// eslint-disable-next-line import/no-cycle
import ReadOnlyPortfolio from "../../screens/Portfolio/ReadOnly";

const Tab = createMaterialTopTabNavigator();

const TabBarContainer = styled(Flex)`
  border-bottom-width: 1px;
  border-bottom-color: ${p => p.theme.colors.palette.neutral.c40};
  background-color: transparent;
`;

const StyledTab = styled.TouchableOpacity``;

function TabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const { colors } = useTheme();

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
          const label = options.title;

          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <StyledTab
              key={index}
              bg={isActive ? "primary.c70" : rgba(colors.constant.white, 0.08)}
              borderRadius={2}
              px={4}
              py={3}
              mr={4}
              onPress={onPress}
            >
              <Text
                fontWeight={"semiBold"}
                variant={"body"}
                color={"neutral.c100"}
              >
                {label}
              </Text>
            </StyledTab>
          );
        })}
      </Flex>
    </TabBarContainer>
  );
}

export default function WalletTabNavigator() {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accounts = useSelector(accountsSelector);

  const { t } = useTranslation();
  return (
    // <Box bg={"red"} flex={1}>
    <Tab.Navigator
      tabBar={(props: MaterialTopTabBarProps) => <TabBar {...props} />}
      screenOptions={{
        tabBarStyle: { backgroundColor: "red" },
      }}
      style={{ backgroundColor: "transparent" }}
      sceneContainerStyle={{ backgroundColor: "transparent" }}
      tabBarOptions={{ style: { backgroundColor: "transparent" } }}
      // lazy
      lazy={true}
    >
      <Tab.Screen
        name={ScreenName.Portfolio}
        component={
          readOnlyModeEnabled && accounts.length <= 0
            ? ReadOnlyPortfolio
            : Portfolio
        }
        options={{
          title: t("wallet.tabs.crypto"),
        }}
      />
      <Tab.Screen
        name={ScreenName.WalletNftGallery}
        component={WalletNftGallery}
        options={{
          title: t("wallet.tabs.nft"),
        }}
      />
    </Tab.Navigator>
    // </Box>
  );
}
