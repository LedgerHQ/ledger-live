// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import PasswordRemove from "../../screens/Settings/General/PasswordRemove";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function PasswordModifyFlowNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.PasswordRemove}
        component={PasswordRemove}
        options={{
          title: t("auth.confirmPassword.title"),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
