import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import DelegationConnectDevice from "~/screens/ConnectDevice";
import DelegationSelectDevice from "~/screens/SelectDevice";
import DelegationSelectValidator from "./SelectValidator";
import DelegationSummary from "./Summary";
import DelegationValidationError from "./ValidationError";
import DelegationValidationSuccess from "./ValidationSuccess";
import type { HederaDelegationFlowParamList } from "./types";

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
        name={ScreenName.HederaDelegationSummary}
        component={DelegationSummary}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("delegation.summaryTitle")}
              subtitle={t("hedera.delegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaDelegationSelectValidator}
        component={DelegationSelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaDelegationSelectDevice}
        component={DelegationSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.delegation.stepperHeader.selectDevice")}
              subtitle={t("hedera.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaDelegationConnectDevice}
        component={DelegationConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("hedera.delegation.stepperHeader.connectDevice")}
              subtitle={t("hedera.delegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaDelegationValidationError}
        component={DelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaDelegationValidationSuccess}
        component={DelegationValidationSuccess}
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

const Stack = createNativeStackNavigator<HederaDelegationFlowParamList>();
