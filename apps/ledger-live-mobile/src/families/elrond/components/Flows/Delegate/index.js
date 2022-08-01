// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import {
  getStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../../../navigation/navigatorConfig";
import StepHeader from "../../../../../components/StepHeader";
import { ScreenName } from "../../../../../const";
import DelegationStarted from "./01-Started.jsx";
import DelegationSelectValidator from "./02-SelectValidator.jsx";
import DelegationAmount from "../../../shared/02-SelectAmount.jsx";
import SelectDevice from "../../../../../screens/SelectDevice";
import ConnectDevice from "../../../../../screens/ConnectDevice";
import DelegationValidationError from "./04-ValidationError.jsx";
import DelegationValidationSuccess from "./04-ValidationSuccess.jsx";

const totalSteps = "3";

function DelegationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.ElrondDelegationStarted}
        component={DelegationStarted}
        options={{
          title: t("elrond.delegation.stepperHeader.starter"),
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondDelegationValidator}
        component={DelegationSelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("elrond.delegation.stepperHeader.validator")}
              subtitle={t("elrond.delegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
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
        name={ScreenName.ElrondDelegationAmount}
        component={DelegationAmount}
        options={({ route }) => ({
          headerRight: null,
          headerTitle: () => (
            <StepHeader
              title={
                route.params.validator?.name ??
                route.params.validator.validatorAddress
              }
              subtitle={t("elrond.delegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.ElrondDelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("elrond.delegation.stepperHeader.selectDevice")}
              subtitle={t("elrond.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondDelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: null,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("elrond.delegation.stepperHeader.connectDevice")}
              subtitle={t("elrond.delegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondDelegationValidationError}
        component={DelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondDelegationValidationSuccess}
        component={DelegationValidationSuccess}
        options={{
          headerLeft: null,
          headerRight: null,
          headerTitle: null,
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
