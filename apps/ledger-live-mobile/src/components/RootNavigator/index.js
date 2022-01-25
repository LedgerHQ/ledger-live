// @flow
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import Config from "react-native-config";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorName } from "../../const";
import { hasCompletedOnboardingSelector } from "../../reducers/settings";
import BaseNavigator from "./BaseNavigator";
import BaseOnboardingNavigator from "./BaseOnboardingNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";

type Props = {
  importDataString?: string,
};

export default function RootNavigator({ importDataString }: Props) {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const data = useMemo<string | false>(() => {
    if (!__DEV__ || !importDataString) {
      return false;
    }

    return JSON.parse(Buffer.from(importDataString, "base64").toString("utf8"));
  }, [importDataString]);

  const goToOnboarding = !hasCompletedOnboarding && !Config.SKIP_ONBOARDING;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {data ? (
        <Stack.Screen
          name={NavigatorName.ImportAccounts}
          component={ImportAccountsNavigator}
        />
      ) : goToOnboarding ? (
        <Stack.Screen
          name={NavigatorName.BaseOnboarding}
          component={BaseOnboardingNavigator}
        />
      ) : null}
      <Stack.Screen name={NavigatorName.Base} component={BaseNavigator} />
      {hasCompletedOnboarding ? (
        <Stack.Screen
          name={NavigatorName.BaseOnboarding}
          component={BaseOnboardingNavigator}
        />
      ) : null}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
