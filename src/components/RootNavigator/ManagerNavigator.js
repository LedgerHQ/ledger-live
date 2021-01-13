// @flow
import React, { useMemo } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ScreenName, NavigatorName } from "../../const";
import { hasAvailableUpdateSelector } from "../../reducers/settings";
import Manager from "../../screens/Manager";
import ManagerMain from "../../screens/Manager/Manager";
import OnboardingNavigator from "./OnboardingNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";
import ReadOnlyTab from "../ReadOnlyTab";
import ManagerIcon from "../../icons/Manager";
import NanoXIcon from "../../icons/TabNanoX";
import { useIsNavLocked } from "./CustomBlockRouterNavigator";

const ManagerIconWithUpate = ({
  color,
  size,
}: {
  color: string,
  size: number,
}) => {
  const { colors } = useTheme();
  return (
    <View style={stylesLocal.iconWrapper}>
      <ManagerIcon size={size} color={color} />
      <View style={[stylesLocal.blueDot, { backgroundColor: colors.live }]} />
    </View>
  );
};

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
          backgroundColor: colors.background,
          borderBottomColor: colors.background,
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
        options={{ title: t("manager.appList.title") }}
      />
      <Stack.Screen
        name={NavigatorName.Onboarding}
        component={OnboardingNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

export function ManagerTabIcon(props: any) {
  const isNavLocked = useIsNavLocked();
  const hasAvailableUpdate = useSelector(hasAvailableUpdateSelector);

  const content = (
    <ReadOnlyTab
      OnIcon={NanoXIcon}
      oni18nKey="tabs.nanoX"
      OffIcon={hasAvailableUpdate ? ManagerIconWithUpate : ManagerIcon}
      offi18nKey="tabs.manager"
      {...props}
    />
  );

  if (isNavLocked) {
    return <TouchableOpacity onPress={() => {}}>{content}</TouchableOpacity>;
  }

  return content;
}

const stylesLocal = StyleSheet.create({
  blueDot: {
    top: 0,
    right: -10,
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  iconWrapper: {
    position: "relative",
  },
});
