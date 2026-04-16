import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { ScreenName } from "~/const";
import { createLumenNativeStackNavigator } from "~/mvvm/components/Navigation";
import { BaanxLoginScreen } from "./screens/BaanxLoginScreen";
import { BaanxDashboardScreen } from "./screens/BaanxDashboardScreen";
import type { BaanxCardNavigatorParamList } from "./types";

interface BaanxAuthContextValue {
  accessToken: string | null;
  setAccessToken: (token: string) => void;
}

const BaanxAuthContext = createContext<BaanxAuthContextValue>({
  accessToken: null,
  setAccessToken: () => {},
});

export function useBaanxAuth() {
  return useContext(BaanxAuthContext);
}

const Stack = createLumenNativeStackNavigator<BaanxCardNavigatorParamList>();

export default function BaanxCardNavigator() {
  // TODO: remove – bypass login for dev
  const [accessToken, setAccessTokenRaw] = useState<string | null>(null);

  const setAccessToken = useCallback((token: string) => {
    setAccessTokenRaw(token);
  }, []);

  const authValue = useMemo(() => ({ accessToken, setAccessToken }), [accessToken, setAccessToken]);

  const isAuthenticated = accessToken !== null;

  return (
    <BaanxAuthContext.Provider value={authValue}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: Platform.OS === "ios",
        }}
        initialRouteName={
          isAuthenticated ? ScreenName.BaanxCardDashboard : ScreenName.BaanxCardLogin
        }
      >
        {isAuthenticated ? (
          <Stack.Screen name={ScreenName.BaanxCardDashboard} component={BaanxDashboardScreen} />
        ) : (
          <Stack.Screen name={ScreenName.BaanxCardLogin} component={BaanxLoginScreen} />
        )}
      </Stack.Navigator>
    </BaanxAuthContext.Provider>
  );
}
