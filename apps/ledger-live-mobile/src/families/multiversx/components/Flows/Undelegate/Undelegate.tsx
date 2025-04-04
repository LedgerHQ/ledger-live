import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";

import StepHeader from "~/components/StepHeader";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ScreenName } from "~/const";

import PickAmount from "./components/PickAmount";
import ValidationError from "./components/ValidationError";
import ValidationSuccess from "./components/ValidationSuccess";

import MultiversXUndelegationSelectDevice from "~/screens/SelectDevice";
import MultiversXUndelegationConnectDevice from "~/screens/ConnectDevice";

import type { MultiversXUndelegationFlowParamList } from "./types";

const Stack = createStackNavigator<MultiversXUndelegationFlowParamList>();
const totalSteps = "3";
const options = {
  headerShown: false,
};

/*
 * Handle the component declaration.
 */

const Undelegate = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  /*
   * Return the rendered component.
   */

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.MultiversXUndelegationAmount}
        component={PickAmount}
        options={props => ({
          headerTitle: () => (
            <StepHeader
              title={props.route.params.validator.identity.name}
              subtitle={t("elrond.undelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />

      <Stack.Screen
        name={ScreenName.MultiversXUndelegationSelectDevice}
        component={MultiversXUndelegationSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("elrond.undelegation.stepperHeader.selectDevice")}
              subtitle={t("elrond.undelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXUndelegationConnectDevice}
        component={MultiversXUndelegationConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("elrond.undelegation.stepperHeader.connectDevice")}
              subtitle={t("elrond.undelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXUndelegationValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXUndelegationValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export { Undelegate as component, options };
