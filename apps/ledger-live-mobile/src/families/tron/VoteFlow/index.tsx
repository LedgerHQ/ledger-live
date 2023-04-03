import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import {
  getStackNavigatorConfig,
} from "../../../navigation/navigatorConfig";
import { TronVoteFlowParamList } from "./types";

function VoteFlow() {
  const { t } = useTranslation();
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
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { VoteFlow as component, options };
const Stack = createStackNavigator<TronVoteFlowParamList>();
