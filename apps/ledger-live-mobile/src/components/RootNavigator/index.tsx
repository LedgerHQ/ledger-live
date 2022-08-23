import React, { useMemo, createContext, useState } from "react";
import { useSelector } from "react-redux";
import Config from "react-native-config";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorName } from "../../const";
import { hasCompletedOnboardingSelector } from "../../reducers/settings";
// eslint-disable-next-line import/no-cycle
import BaseNavigator from "./BaseNavigator";
// eslint-disable-next-line import/no-cycle
import BaseOnboardingNavigator from "./BaseOnboardingNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";

export const AnalyticsContext = createContext<{
  source: undefined | string;
  screen: undefined | string;
  setSource: (_: undefined | string) => void;
  setScreen: (_: undefined | string) => void;
}>({
  source: undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSource: () => {},
});
type Props = {
  importDataString?: string;
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
  const [analyticsSource, setAnalyticsSource] = useState<undefined | string>(
    undefined,
  );
  const [analyticsScreen, setAnalyticsScreen] = useState<undefined | string>(
    undefined,
  );
  return (
    <AnalyticsContext.Provider
      value={{
        source: analyticsSource,
        screen: analyticsScreen,
        setSource: setAnalyticsSource,
        setScreen: setAnalyticsScreen,
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
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
    </AnalyticsContext.Provider>
  );
}
const Stack = createStackNavigator();
