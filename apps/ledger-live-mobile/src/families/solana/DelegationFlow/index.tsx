import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import DelegationConnectDevice from "~/screens/ConnectDevice";
import DelegationSelectDevice from "~/screens/SelectDevice";
import DelegationSelectValidator from "./SelectValidator";
import DelegationStarted from "./Started";
import DelegationSummary from "./Summary";
import DelegationValidationError from "./ValidationError";
import DelegationValidationSuccess from "./ValidationSuccess";
import DelegationSelectAmount from "./SelectAmount";
import type { SolanaDelegationFlowParamList } from "./types";

const totalSteps = "3";

function DelegationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.SolanaDelegationStarted}
        component={DelegationStarted}
        options={{
          headerTitle: () => <StepHeader title={t("delegation.started.title")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationSummary}
        component={DelegationSummary}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("delegation.summaryTitle")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationSelectValidator}
        component={DelegationSelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.SolanaEditAmount}
        component={DelegationSelectAmount}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("send.stepperHeader.selectAmount")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.DelegationConnectDevice}
        component={DelegationConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.connectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationSelectDevice}
        component={DelegationSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.selectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationValidationSuccess}
        component={DelegationValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationValidationError}
        component={DelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { DelegationFlow as component, options };

const Stack = createStackNavigator<SolanaDelegationFlowParamList>();
