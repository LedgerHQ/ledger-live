import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
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
  const { theme } = useLumenTheme();
  const canvas = { backgroundColor: theme.colors.bg.canvas };
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        contentStyle: canvas,
        headerStyle: canvas,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.XrpManageTokenList}
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
