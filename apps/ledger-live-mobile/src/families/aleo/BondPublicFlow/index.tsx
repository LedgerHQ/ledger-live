import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import SelectValidator from "./SelectValidator";
import Amount from "./Amount";
import Summary from "./Summary";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { BondPublicFlowParamList } from "./types";

const totalSteps = "3";

function BondPublicFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AleoBondPublicSelectValidator}
        component={SelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("aleo.bond.stepperHeader.validator")}
              subtitle={t("aleo.bond.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("aleo.bond.stepperHeader.amount")}
              subtitle={t("aleo.bond.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicSummary}
        component={Summary}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("aleo.bond.stepperHeader.summary")}
              subtitle={t("aleo.bond.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => <StepHeader title={t("aleo.bond.stepperHeader.selectDevice")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicConnectDevice}
        component={ConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("aleo.bond.stepperHeader.connectDevice")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<BondPublicFlowParamList>();
const options = { headerShown: false };
export { BondPublicFlow as component, options };
