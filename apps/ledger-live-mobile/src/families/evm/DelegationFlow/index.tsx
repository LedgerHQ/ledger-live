import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import { useTranslation } from "~/context/Locale";
import DelegationStarted from "./01-Started";
import SelectValidator from "./SelectValidator";
import DelegationValidationError from "./04-ValidationError";
import DelegationValidationSuccess from "./04-ValidationSuccess";
import type { EvmDelegationFlowParamList } from "./types";

const Stack = createNativeStackNavigator<EvmDelegationFlowParamList>();

const totalSteps = "2";

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
        name={ScreenName.EvmDelegationStarted}
        component={DelegationStarted}
        options={{
          headerTitle: () => <StepHeader title={t("delegation.started.title")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationValidatorSelect}
        component={SelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("evm.delegation.stepperHeader.selectDevice")}
              subtitle={t("evm.delegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("evm.delegation.stepperHeader.connectDevice")}
              subtitle={t("evm.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationValidationError}
        component={DelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationValidationSuccess}
        component={DelegationValidationSuccess}
        options={{
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: "",
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
