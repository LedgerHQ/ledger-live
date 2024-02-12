import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";

import StepHeader from "~/components/StepHeader";
import WithdrawSelectDevice from "~/screens/SelectDevice";
import WithdrawConnectDevice from "~/screens/ConnectDevice";

import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ScreenName } from "~/const";

import WithdrawFunds from "./components/WithdrawFunds";
import ValidationError from "./components/ValidationError";
import ValidationSuccess from "./components/ValidationSuccess";

import type { ElrondWithdrawFlowParamList } from "./types";

const Stack = createStackNavigator<ElrondWithdrawFlowParamList>();
const totalSteps = "3";
const options = {
  headerShown: false,
};

/*
 * Handle the component declaration.
 */

const Withdraw = () => {
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
        name={ScreenName.ElrondWithdrawFunds}
        component={WithdrawFunds}
        options={{
          headerTitle: () => <StepHeader title={t("elrond.withdraw.stepperHeader.method")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.ElrondWithdrawSelectDevice}
        component={WithdrawSelectDevice}
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
        name={ScreenName.ElrondWithdrawConnectDevice}
        component={WithdrawConnectDevice}
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
        name={ScreenName.ElrondWithdrawValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={ScreenName.ElrondWithdrawValidationSuccess}
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

export { Withdraw as component, options };
