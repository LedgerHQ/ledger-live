import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import SelectDevice from "~/screens/SelectDevice";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import Amount from "./Amount";
import ConnectDevice from "./ConnectDevice";
import Started from "./Started";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";
import type { InternetComputerStakingFlowParamList } from "./types";

const totalSteps = "3";

function StakingFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const step = (title: string, currentStep?: string) => ({
    headerTitle: () => (
      <StepHeader
        title={title}
        subtitle={
          currentStep ? t("send.stepperHeader.stepRange", { currentStep, totalSteps }) : undefined
        }
      />
    ),
  });

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.InternetComputerStakingStarted}
        component={Started}
        options={step(t("internetComputer.stakingFlow.started.title"))}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingAmount}
        component={Amount}
        options={step(t("send.stepperHeader.selectAmount"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingSelectDevice}
        component={SelectDevice}
        options={step(t("send.stepperHeader.selectDevice"), "2")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingConnectDevice}
        component={ConnectDevice}
        options={{
          ...step(t("send.stepperHeader.connectDevice"), "3"),
          headerLeft: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
        listeners={{
          beforeRemove: () => {
            notifyFlowCompleted("stake");
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };

export { StakingFlow as component, options };

const Stack = createNativeStackNavigator<InternetComputerStakingFlowParamList>();
