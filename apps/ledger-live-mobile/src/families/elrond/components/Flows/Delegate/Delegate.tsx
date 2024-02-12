import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";

import StepHeader from "~/components/StepHeader";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ScreenName } from "~/const";

import EarnRewards from "./components/EarnRewards";
import SetDelegation from "./components/SetDelegation";
import PickValidator from "./components/PickValidator";
import PickAmount from "./components/PickAmount";
import ValidationError from "./components/ValidationError";
import ValidationSuccess from "./components/ValidationSuccess";

import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";

import type { ElrondDelegationFlowParamList } from "./types";

const totalSteps = "3";
const options = {
  headerShown: false,
};

const Stack = createStackNavigator<ElrondDelegationFlowParamList>();

/*
 * Handle the component declaration.
 */

const Delegate = () => {
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
        name={ScreenName.ElrondDelegationStarted}
        component={EarnRewards}
        options={{
          headerTitle: () => <StepHeader title={t("delegation.started.title")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.ElrondDelegationValidator}
        component={SetDelegation}
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
        name={ScreenName.ElrondDelegationValidatorList}
        component={PickValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.ElrondDelegationAmount}
        component={PickAmount}
        options={props => ({
          headerTitle: () => (
            <StepHeader
              title={props.route.params.validatorName}
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
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.delegation.stepperHeader.connectDevice")}
              subtitle={t("cosmos.delegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.ElrondDelegationValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={ScreenName.ElrondDelegationValidationSuccess}
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

export { Delegate as component, options };
