import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import UndelegationAmount from "./Amount";
import UndelegationValidationError from "./ValidationError";
import UndelegationValidationSuccess from "./ValidationSuccess";
import type { HederaUndelegationFlowParamList } from "./types";

const totalSteps = "3";

function UndelegationFlow() {
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
        name={ScreenName.HederaUndelegationAmount}
        component={UndelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              subtitle={t("hedera.undelegation.stepperHeader.amount")}
              title={route.params.enrichedDelegation.validator.name}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.HederaUndelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.undelegation.stepperHeader.selectDevice")}
              subtitle={t("hedera.undelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaUndelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("hedera.undelegation.stepperHeader.connectDevice")}
              subtitle={t("hedera.undelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaUndelegationValidationError}
        component={UndelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaUndelegationValidationSuccess}
        component={UndelegationValidationSuccess}
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

export { UndelegationFlow as component, options };

const Stack = createNativeStackNavigator<HederaUndelegationFlowParamList>();
