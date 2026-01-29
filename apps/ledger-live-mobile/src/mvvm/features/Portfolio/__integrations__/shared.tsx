import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { PortfolioScreen as Portfolio } from "../screens/Portfolio";
import ReadOnlyPortfolio from "../screens/ReadOnly";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { State } from "~/reducers/types";

type TestStackParamList = WalletTabNavigatorStackParamList;

const Stack = createNativeStackNavigator<TestStackParamList>();

export const PortfolioTest = () => (
  <Stack.Navigator initialRouteName={ScreenName.Portfolio}>
    <Stack.Screen name={ScreenName.Portfolio} component={Portfolio} />
  </Stack.Navigator>
);

export const ReadOnlyPortfolioTest = () => (
  <Stack.Navigator initialRouteName={ScreenName.Portfolio}>
    <Stack.Screen name={ScreenName.Portfolio} component={ReadOnlyPortfolio} />
  </Stack.Navigator>
);

export const overrideInitialStateWithFeatureFlag = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    overriddenFeatureFlags: {
      lwmWallet40: { enabled: true },
    },
  },
});

export const overrideInitialStateWithGraphReworkEnabled = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    overriddenFeatureFlags: {
      lwmWallet40: { enabled: true, params: { graphRework: true } },
    },
  },
});

export const overrideInitialStateWithGraphReworkAndReadOnly = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    readOnlyModeEnabled: true,
    overriddenFeatureFlags: {
      lwmWallet40: { enabled: true, params: { graphRework: true } },
    },
  },
});
