// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import PasswordAdd from "../../screens/Settings/General/PasswordAdd";
import ConfirmPassword from "../../screens/Settings/General/ConfirmPassword";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function PasswordAddFlowNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.PasswordAdd}
        component={PasswordAdd}
        options={{ title: t("auth.addPassword.title") }}
      />
      <Stack.Screen
        name={ScreenName.ConfirmPassword}
        component={ConfirmPassword}
        options={{
          title: t("auth.confirmPassword.title"),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
