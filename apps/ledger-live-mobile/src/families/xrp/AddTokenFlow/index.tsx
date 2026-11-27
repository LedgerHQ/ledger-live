import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { ScreenName } from "~/const";
import { bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import BalanceLimit from "./BalanceLimit";
import Confirmation from "./Confirmation";
import Review from "./Review";
import SelectToken from "./SelectToken";
import type { XrpAddTokenFlowParamList } from "./types";

const Stack = createLumenNativeStackNavigator<XrpAddTokenFlowParamList>();

const options = {
  headerShown: false,
};

function AddTokenFlow() {
  const { theme } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.XrpAddTokenSelectToken}
        component={SelectToken}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenReview}
        component={Review}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenBalanceLimit}
        component={BalanceLimit}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenConfirmation}
        component={Confirmation}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}

export { AddTokenFlow as component, options };
