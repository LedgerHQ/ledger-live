import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { CommonActions, useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import { NavigatorName, ScreenName } from "~/const";
import { AleoAddAccountParamList, AleoViewKeyFlowParamList } from "./types";
import ViewKeyWarningScreen from "./ViewKeyWarningScreen";
import ViewKeyApproveScreen from "./ViewKeyApproveScreen";
import ViewKeyRejectedScreen from "./ViewKeyRejectedScreen";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<AleoAddAccountParamList, ScreenName.AleoAddAccount>;

const Stack = createNativeStackNavigator<AleoViewKeyFlowParamList>();

function AddAccountNavigator({ route, navigation }: Props) {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, false), [colors]);
  const initialRouteName = route.params.initialRoute ?? ScreenName.AleoViewKeyWarning;

  // Navigation (which calls exitProcess → navigation.goBack()
  // in Navigator.tsx and fails when there is no back history in BaseNavigator).
  // Instead, call goBack() directly from this level where navigation.getParent() reliably
  // reaches BaseNavigator, and fall back to an explicit navigate when canGoBack() is false.
  const handleClose = useCallback(() => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) {
      parent.goBack();
    } else {
      parent?.dispatch(CommonActions.navigate({ name: NavigatorName.Main }));
    }
  }, [navigation]);

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
      <Stack.Screen
        name={ScreenName.AleoViewKeyApprove}
        component={ViewKeyApproveScreen}
        initialParams={{ ...route.params, onCloseNavigation: handleClose }}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name={ScreenName.AleoViewKeyRejected}
        component={ViewKeyRejectedScreen}
        initialParams={{ ...route.params, onCloseNavigation: handleClose }}
        options={{ headerTitle: "", headerLeft: () => null }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { AddAccountNavigator as component, options };
export default AddAccountNavigator;
