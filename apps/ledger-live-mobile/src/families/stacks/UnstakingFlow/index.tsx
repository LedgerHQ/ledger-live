import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig, bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import Summary from "./Summary";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { StacksUnstakingFlowParamList } from "./types";

const Stack = createNativeStackNavigator<StacksUnstakingFlowParamList>();

function SummaryHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("stacks.unstake.stepperHeader.summary")} />;
}

function SelectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("stacks.unstake.stepperHeader.selectDevice")} />;
}

function ConnectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("stacks.unstake.stepperHeader.connectDevice")} />;
}

function UnstakingFlow() {
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.StacksUnstakingSummary}
        component={Summary}
        options={{ headerTitle: SummaryHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksUnstakingSelectDevice}
        component={SelectDevice}
        options={{ headerTitle: SelectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksUnstakingConnectDevice}
        component={ConnectDevice}
        options={{ gestureEnabled: false, headerTitle: ConnectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksUnstakingValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.StacksUnstakingValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };
export { UnstakingFlow as component, options };
