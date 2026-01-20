import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import Portfolio from "../screens/Portfolio";
import ReadOnlyPortfolio from "../screens/ReadOnly";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";

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
