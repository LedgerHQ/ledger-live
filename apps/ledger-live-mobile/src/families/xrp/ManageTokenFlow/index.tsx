import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { ScreenName } from "~/const";
import { bridgeSuspenseScreenLayout, getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ManageToken from "./ManageToken";
import type { XrpManageTokenFlowParamList } from "./types";

const Stack = createNativeStackNavigator<XrpManageTokenFlowParamList>();

const options = {
  headerShown: false,
};

function renderBackButton() {
  return <NavigationHeaderBackButton />;
}

function ManageTokenFlow() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.XrpManageTokenManage}
        component={ManageToken}
        options={{
          headerLeft: renderBackButton,
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}

export { ManageTokenFlow as component, options };
