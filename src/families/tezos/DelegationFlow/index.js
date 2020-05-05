// @flow
import React from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import { closableStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import DelegationStarted from "./Started";
import DelegationSummary from "./Summary";
import DelegationSelectValidator from "./SelectValidator";
import DelegationConnectDevice from "./ConnectDevice";
import DelegationValidation from "./Validation";
import DelegationValidationSuccess from "./ValidationSuccess";
import DelegationValidationError from "./ValidationError";

function DelegationFlow() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        ...closableStackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.DelegationStarted}
        component={DelegationStarted}
        options={{
          headerTitle: () => (
            <StepHeader title={t("delegation.started.title")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationSummary}
        component={DelegationSummary}
        options={{
          headerLeft: null,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("delegation.summaryTitle")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationSelectValidator}
        component={DelegationSelectValidator}
        options={{
          headerRight: null,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader title={t("delegation.selectValidatorTitle")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationConnectDevice}
        component={DelegationConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.connectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.DelegationValidation}
        component={DelegationValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.verification")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
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

const Stack = createStackNavigator();
