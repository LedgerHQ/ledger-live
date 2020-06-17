// @flow
import React from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import {
  closableStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import DelegationStarted from "./01-Started";
import DelegationSelectValidator from "./02-SelectValidator";
import DelegationAmount from "../shared/02-SelectAmount";
import DelegationConnectDevice from "./03-ConnectDevice";
import DelegationValidation from "./04-Validation";
import DelegationValidationError from "./04-ValidationError";
import DelegationValidationSuccess from "./04-ValidationSuccess";

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
        name={ScreenName.CosmosDelegationStarted}
        component={DelegationStarted}
        options={{
          title: t("cosmos.delegation.stepperHeader.starter"),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosDelegationValidator}
        component={DelegationSelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.delegation.stepperHeader.validator")}
              subtitle={t("cosmos.delegation.stepperHeader.stepRange", {
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
        name={ScreenName.CosmosDelegationAmount}
        component={DelegationAmount}
        options={({ route }) => ({
          headerRight: null,
          headerTitle: () => (
            <StepHeader
              title={
                route.params.validator?.name ??
                route.params.validator.validatorAddress
              }
              subtitle={t("cosmos.delegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.CosmosDelegationConnectDevice}
        component={DelegationConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.delegation.stepperHeader.connectDevice")}
              subtitle={t("cosmos.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosDelegationValidation}
        component={DelegationValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.delegation.stepperHeader.verification")}
              subtitle={t("cosmos.delegation.stepperHeader.stepRange", {
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
        name={ScreenName.CosmosDelegationValidationError}
        component={DelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosDelegationValidationSuccess}
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

const Stack = createStackNavigator();
