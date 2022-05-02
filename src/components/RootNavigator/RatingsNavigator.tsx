// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import RatingsInit from "../../screens/RatingsModal/Init";
import RatingsEnjoy from "../../screens/RatingsModal/Enjoy";
import RatingsDisappointed from "../../screens/RatingsModal/Disappointed";
import RatingsDisappointedForm from "../../screens/RatingsModal/DisappointedForm";
import RatingsDisappointedDone from "../../screens/RatingsModal/DisappointedDone";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function ReceiveFundsNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.RatingsInit}
        component={RatingsInit}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.RatingsEnjoy}
        component={RatingsEnjoy}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.RatingsDisappointed}
        component={RatingsDisappointed}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.RatingsDisappointedForm}
        component={RatingsDisappointedForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.RatingsDisappointedDone}
        component={RatingsDisappointedDone}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
