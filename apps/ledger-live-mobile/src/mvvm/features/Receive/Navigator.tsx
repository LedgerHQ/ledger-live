import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import type { ReceiveNavigatorParamList } from "~/components/RootNavigator/types/ReceiveNavigator";
import { ScreenName } from "~/const";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import ReceiveAddressScreen from "./screens/ReceiveAddress";

const Stack = createLumenNativeStackNavigator<ReceiveNavigatorParamList>();

/** The new receive flow (`newReceiveFlow`), opened by `getReceiveRoute`. */
export function ReceiveNavigator(): React.JSX.Element {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const onClose = useCallback(() => navigation.goBack(), [navigation]);
  const { notifyFlowCompleted } = useNotificationsPrompt();

  const stackNavigationConfig = useMemo(
    () => getStackNavigationConfigV4(theme, "compact", true, onClose),
    [theme, onClose],
  );

  return (
    <Stack.Navigator
      screenOptions={{ ...stackNavigationConfig, gestureEnabled: Platform.OS === "ios" }}
    >
      <Stack.Screen
        name={ScreenName.ReceiveAddress}
        component={ReceiveAddressScreen}
        options={{ title: "", headerLeft: () => null }}
        // Every way out of receive offers the notifications prompt, as the legacy flow does.
        listeners={{ beforeRemove: () => notifyFlowCompleted("receive") }}
      />
    </Stack.Navigator>
  );
}
