import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig, bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";

import RegisterAccountStarted from "./01-Started";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { CeloRegistrationFlowParamList } from "./types";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

const totalSteps = "3";

function RegisterAccountFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsContext();

  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig} screenLayout={bridgeSuspenseScreenLayout}>
      <Stack.Screen
        name={ScreenName.CeloRegistrationStarted}
        component={RegisterAccountStarted}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.register.stepperHeader.title")}
              subtitle={t("celo.register.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRegistrationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.register.stepperHeader.selectDevice")}
              subtitle={t("celo.register.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRegistrationConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.register.stepperHeader.connectDevice")}
              subtitle={t("celo.register.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRegistrationValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
        listeners={{
          beforeRemove: () => {
            notifyFlowCompleted("stake");
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRegistrationValidationError}
        component={ValidationError}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { RegisterAccountFlow as component, options };

const Stack = createNativeStackNavigator<CeloRegistrationFlowParamList>();
