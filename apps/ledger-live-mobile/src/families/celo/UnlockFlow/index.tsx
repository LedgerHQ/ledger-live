import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";

import UnlockAmount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import { CeloUnlockFlowParamList } from "./types";

const totalSteps = "3";

function UnlockFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.CeloUnlockAmount}
        component={UnlockAmount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.unlock.stepperHeader.title")}
              subtitle={t("celo.unlock.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloUnlockSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.unlock.stepperHeader.selectDevice")}
              subtitle={t("celo.unlock.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloUnlockConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.unlock.stepperHeader.connectDevice")}
              subtitle={t("celo.unlock.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloUnlockValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloUnlockValidationError}
        component={ValidationError}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { UnlockFlow as component, options };

const Stack = createStackNavigator<CeloUnlockFlowParamList>();
