// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import ScanAccounts from "../../screens/ImportAccounts/Scan";
import DisplayResult, {
  BackButton,
} from "../../screens/ImportAccounts/DisplayResult";
import FallBackCameraScreen from "../../screens/ImportAccounts/FallBackCameraScreen";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import HeaderRightClose from "../HeaderRightClose";
import colors from "../../colors";

export default function ImportAccountsNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.ScanAccounts}
        component={ScanAccounts}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerShown: true,
          title: t("account.import.scan.title"),
          headerRight: props => (
            <HeaderRightClose {...props} color={colors.white} />
          ),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.DisplayResult}
        component={DisplayResult}
        options={{
          title: t("account.import.result.title"),
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.FallBackCameraScreen}
        component={FallBackCameraScreen}
        options={{
          title: t("account.import.fallback.header"),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
