import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import UndelegationSummary from "./01-Summary";
import UndelegationValidationError from "./03-ValidationError";
import UndelegationValidationSuccess from "./03-ValidationSuccess";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import { CardanoUndelegationFlowParamList } from "./types";

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
        name={ScreenName.CardanoUndelegationSummary}
        component={UndelegationSummary}
        options={() => ({
          headerTitle: () => <StepHeader title={t("cardano.undelegation.undelegate")} />,
        })}
      />
      <Stack.Screen
        name={ScreenName.CardanoUndelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cardano.delegation.stepperHeader.selectDevice")}
              subtitle={t("cardano.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CardanoUndelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("cardano.delegation.stepperHeader.connectDevice")}
              subtitle={t("cardano.delegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CardanoUndelegationValidationError}
        component={UndelegationValidationError}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CardanoUndelegationValidationSuccess}
        component={UndelegationValidationSuccess}
        options={{
          headerLeft: undefined,
          headerTitle: "",
          headerRight: undefined,
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

const Stack = createStackNavigator<CardanoUndelegationFlowParamList>();
