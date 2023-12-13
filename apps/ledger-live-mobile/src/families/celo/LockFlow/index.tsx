import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";

import LockAmount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { CeloLockFlowParamList } from "./types";

const totalSteps = "3";

function LockFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.CeloLockAmount}
        component={LockAmount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.lock.stepperHeader.title")}
              subtitle={t("celo.lock.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloLockSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.lock.stepperHeader.selectDevice")}
              subtitle={t("celo.lock.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloLockConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.lock.stepperHeader.connectDevice")}
              subtitle={t("celo.lock.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloLockValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloLockValidationError}
        component={ValidationError}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { LockFlow as component, options };

const Stack = createStackNavigator<CeloLockFlowParamList>();
