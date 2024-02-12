import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig, defaultNavigationOptions } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import OptInSelectToken from "./01-SelectToken";
import OptInSelectDevice from "~/screens/SelectDevice";
import OptInConnectDevice from "~/screens/ConnectDevice";
import OptInValidation from "./03-Validation";
import OptInValidationError from "./03-ValidationError";
import OptInValidationSuccess from "./03-ValidationSuccess";
import type { AlgorandOptInFlowParamList } from "./types";

function OptInFlow() {
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
        name={ScreenName.AlgorandOptInSelectToken}
        component={OptInSelectToken}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.optIn.stepperHeader.selectToken")}
              subtitle={t("algorand.optIn.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: () => null,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandOptInSelectDevice}
        component={OptInSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.optIn.stepperHeader.connectDevice")}
              subtitle={t("algorand.optIn.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandOptInConnectDevice}
        component={OptInConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.optIn.stepperHeader.connectDevice")}
              subtitle={t("algorand.optIn.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandOptInSummary}
        component={OptInValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.optIn.stepperHeader.verification")}
              subtitle={t("algorand.optIn.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: undefined,
          headerRight: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandOptInValidationError}
        component={OptInValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandOptInValidationSuccess}
        component={OptInValidationSuccess}
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
export { OptInFlow as component, options };
const Stack = createStackNavigator<AlgorandOptInFlowParamList>();
