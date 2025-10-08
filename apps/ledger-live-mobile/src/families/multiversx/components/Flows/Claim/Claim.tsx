import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";

import StepHeader from "~/components/StepHeader";
import ClaimRewardsSelectDevice from "~/screens/SelectDevice";
import ClaimRewardsConnectDevice from "~/screens/ConnectDevice";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { ScreenName } from "~/const";

import PickValidator from "./components/PickValidator";
import PickMethod from "./components/PickMethod";
import ValidationError from "./components/ValidationError";
import ValidationSuccess from "./components/ValidationSuccess";

import type { MultiversXClaimRewardsFlowParamList } from "./types";

const Stack = createNativeStackNavigator<MultiversXClaimRewardsFlowParamList>();
const totalSteps = "3";
const options = {
  headerShown: false,
};

/*
 * Handle the component declaration.
 */

const Claim = () => {
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
        name={ScreenName.MultiversXClaimRewardsValidator}
        component={PickValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("elrond.claimRewards.stepperHeader.validator")}
              subtitle={t("elrond.claimRewards.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: () => null,
          gestureEnabled: false,
          headerStyle: styles.headerNoShadow,
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXClaimRewardsMethod}
        component={PickMethod}
        options={{
          headerTitle: () => <StepHeader title={t("elrond.claimRewards.stepperHeader.method")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXClaimRewardsSelectDevice}
        component={ClaimRewardsSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("elrond.claimRewards.stepperHeader.selectDevice")}
              subtitle={t("elrond.claimRewards.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXClaimRewardsConnectDevice}
        component={ClaimRewardsConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("elrond.claimRewards.stepperHeader.connectDevice")}
              subtitle={t("elrond.claimRewards.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXClaimRewardsValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={ScreenName.MultiversXClaimRewardsValidationSuccess}
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

export { Claim as component, options };
