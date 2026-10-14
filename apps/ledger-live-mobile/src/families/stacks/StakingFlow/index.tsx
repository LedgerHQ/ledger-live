import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig, bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import ConnectDevice from "~/screens/ConnectDevice";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import SelectPool from "./SelectPool";
import Amount from "./Amount";
import SelectDevice from "./SelectDevice";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { StacksStakingFlowParamList } from "./types";

const totalSteps = "2";

const Stack = createNativeStackNavigator<StacksStakingFlowParamList>();

function SelectPoolHeader() {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t("stacks.stake.stepperHeader.pool")}
      subtitle={t("stacks.stake.stepperHeader.stepRange", { currentStep: "1", totalSteps })}
    />
  );
}

function AmountHeader() {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t("stacks.stake.stepperHeader.amount")}
      subtitle={t("stacks.stake.stepperHeader.stepRange", { currentStep: "2", totalSteps })}
    />
  );
}

function SelectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("stacks.stake.stepperHeader.selectDevice")} />;
}

function ConnectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("stacks.stake.stepperHeader.connectDevice")} />;
}

function StakingFlow() {
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
        name={ScreenName.StacksStakingPool}
        component={SelectPool}
        options={{ headerTitle: SelectPoolHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksStakingAmount}
        component={Amount}
        options={{ headerTitle: AmountHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksStakingSelectDevice}
        component={SelectDevice}
        options={{ headerTitle: SelectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksStakingConnectDevice}
        component={ConnectDevice}
        options={{ gestureEnabled: false, headerTitle: ConnectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.StacksStakingValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.StacksStakingValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };
export { StakingFlow as component, options };
