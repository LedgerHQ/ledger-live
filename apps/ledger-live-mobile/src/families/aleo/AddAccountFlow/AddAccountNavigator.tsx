import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { AleoAddAccountParamList, AleoViewKeyFlowParamList } from "./types";
import ViewKeyWarningScreen from "./ViewKeyWarningScreen";

type Props = StackNavigatorProps<AleoAddAccountParamList, ScreenName.AleoAddAccount>;

const Stack = createNativeStackNavigator<AleoViewKeyFlowParamList>();

const DEFAULT_ADD_ACCOUNT_FLOW_DEPTH = 2; // SelectDevice + AddAccounts

function AddAccountNavigator({ route, navigation }: Props) {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, false), [colors]);
  const initialRouteName = route.params.initialRoute ?? ScreenName.AleoViewKeyWarning;
  const navigationDepth = route.params.navigationDepth;
  const handleClose = useCallback(() => {
    const parent = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
    parent?.pop(navigationDepth ?? DEFAULT_ADD_ACCOUNT_FLOW_DEPTH);
  }, [navigation, navigationDepth]);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
        headerRight: () => <NavigationHeaderCloseButton onPress={handleClose} />,
      }}
    >
      <Stack.Screen
        name={ScreenName.AleoViewKeyWarning}
        component={ViewKeyWarningScreen}
        initialParams={{ ...route.params, onCloseNavigation: handleClose }}
        options={{ headerTitle: "" }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { AddAccountNavigator as component, options };
export default AddAccountNavigator;
