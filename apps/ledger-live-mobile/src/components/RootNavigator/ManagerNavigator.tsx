import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { NanoFoldedMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box, Icons, Flex } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";
import { hasAvailableUpdateSelector } from "../../reducers/settings";
import Manager from "../../screens/Manager";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";
import TabIcon from "../TabIcon";
import { useIsNavLocked } from "./CustomBlockRouterNavigator";
import ManagerMain from "../../screens/Manager/Manager";

const BadgeContainer = styled(Flex).attrs({
  position: "absolute",
  top: -1,
  right: -1,
  width: 14,
  height: 14,
  borderRadius: 7,
  borderWidth: 3,
})``;

const Badge = () => {
  const { colors } = useTheme();
  return (
    <BadgeContainer
      style={{
        backgroundColor: colors.constant.purple,
        borderColor: colors.background.main,
      }}
    />
  );
};

const ManagerIconWithUpate = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => (
  <Box>
    <Icons.NanoFoldedMedium size={size} color={color} />
    <Badge />
  </Box>
);

export default function ManagerNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [
    colors,
  ]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavConfig,
        headerStyle: {
          ...styles.header,
          backgroundColor: colors.background.main,
          borderBottomColor: colors.background.main,
        },
      }}
    >
      <Stack.Screen
        name={ScreenName.Manager}
        component={Manager}
        options={{
          title: t("manager.title"),
          headerRight: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ManagerMain}
        component={ManagerMain}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

export function ManagerTabIcon(props: any) {
  const isNavLocked = useIsNavLocked();
  const hasAvailableUpdate = useSelector(hasAvailableUpdateSelector);

  const content = (
    <TabIcon
      {...props}
      Icon={hasAvailableUpdate ? ManagerIconWithUpate : NanoFoldedMedium}
      i18nKey="tabs.manager"
    />
  );

  if (isNavLocked) {
    return <TouchableOpacity onPress={() => {}}>{content}</TouchableOpacity>;
  }

  return content;
}
