// @flow
import React from "react";
import { TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName, NavigatorName } from "../../const";
import Manager from "../../screens/Manager";
import ManagerMain from "../../screens/Manager/Manager";
import OnboardingNavigator from "./OnboardingNavigator";
import { stackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";
import ReadOnlyTab from "../ReadOnlyTab";
import ManagerIcon from "../../icons/Manager";
import NanoXIcon from "../../icons/TabNanoX";
import { useIsNavLocked } from "./CustomBlockRouterNavigator";

export default function ManagerNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        headerStyle: styles.header,
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

  const content = (
    <ReadOnlyTab
      OnIcon={NanoXIcon}
      oni18nKey="tabs.nanoX"
      OffIcon={ManagerIcon}
      offi18nKey="tabs.manager"
      {...props}
    />
  );

  if (isNavLocked) {
    return <TouchableOpacity onPress={() => {}}>{content}</TouchableOpacity>;
  }

  return content;
}
