import React, { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { abandonStakePosition } from "@features/flow-stake-position";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import StepHeader from "~/components/StepHeader";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { bridgeSuspenseScreenLayout, getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import type { SolanaStakePositionFlowParamList } from "./types";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";

type Props = StackNavigatorProps<
  BaseNavigatorStackParamList,
  NavigatorName.SolanaStakePositionFlow
>;

const Stack = createNativeStackNavigator<SolanaStakePositionFlowParamList>();

function SelectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("send.stepperHeader.selectDevice")} />;
}

function ConnectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("send.stepperHeader.connectDevice")} />;
}

/** Signs and broadcasts the exit the stake position sheet handed off. */
function StakePositionFlow({ route }: Props) {
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const requestId = route.params?.params?.requestId;

  // Leaving the device screens without a result answers the live app; a settled request ignores it.
  useEffect(
    () => () => {
      if (requestId !== undefined) abandonStakePosition(requestId);
    },
    [requestId],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.SolanaStakePositionSelectDevice}
        component={SelectDevice}
        options={{ headerTitle: SelectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.SolanaStakePositionConnectDevice}
        component={ConnectDevice}
        options={{ gestureEnabled: false, headerTitle: ConnectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.SolanaStakePositionValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.SolanaStakePositionValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };

export { StakePositionFlow as component, options };
