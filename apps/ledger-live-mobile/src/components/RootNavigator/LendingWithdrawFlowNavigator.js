// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import LendingWithdrawAmount from "../../screens/Lending/WithdrawFlow/01-Amount";
import LendingWithdrawSummary from "../../screens/SendFunds/04-Summary";
import SelectDevice from "../../screens/SelectDevice";
import LendingWithdrawConnectDevice from "../../screens/ConnectDevice";
import LendingWithdrawValidationSuccess from "../../screens/Lending/WithdrawFlow/03-ValidationSuccess";
import LendingWithdrawValidationError from "../../screens/Lending/WithdrawFlow/03-ValidationError";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

const totalSteps = "4";

export default function LendingWithdrawFlowNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.LendingWithdrawAmount}
        component={LendingWithdrawAmount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.withdraw.stepperHeader.amount")}
              subtitle={t("transfer.lending.withdraw.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingWithdrawSummary}
        component={LendingWithdrawSummary}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.withdraw.stepperHeader.summary")}
              subtitle={t("transfer.lending.withdraw.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingWithdrawSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.withdraw.stepperHeader.selectDevice")}
              subtitle={t("transfer.lending.withdraw.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingWithdrawConnectDevice}
        component={LendingWithdrawConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.withdraw.stepperHeader.connectDevice")}
              subtitle={t("transfer.lending.withdraw.stepperHeader.stepRange", {
                currentStep: "4",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingWithdrawValidationSuccess}
        component={LendingWithdrawValidationSuccess}
        options={{
          headerLeft: null,
          headerShown: false,
          headerRight: null,
          gestureWithdrawd: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingWithdrawValidationError}
        component={LendingWithdrawValidationError}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
