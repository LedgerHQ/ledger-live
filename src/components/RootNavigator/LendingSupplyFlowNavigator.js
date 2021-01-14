// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import LendingSupplyAmount from "../../screens/Lending/SupplyFlow/01-Amount";
import LendingSupplySummary from "../../screens/SendFunds/04-Summary";
import SelectDevice from "../../screens/SelectDevice";
import LendingSupplyConnectDevice from "../../screens/ConnectDevice";
import LendingSupplyValidationSuccess from "../../screens/Lending/SupplyFlow/03-ValidationSuccess";
import LendingSupplyValidationError from "../../screens/Lending/SupplyFlow/03-ValidationError";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

const totalSteps = "4";

export default function LendingSupplyFlowNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.LendingSupplyAmount}
        component={LendingSupplyAmount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.supply.stepperHeader.amount")}
              subtitle={t("transfer.lending.supply.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingSupplySummary}
        component={LendingSupplySummary}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.supply.stepperHeader.summary")}
              subtitle={t("transfer.lending.supply.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingSupplySelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.supply.stepperHeader.selectDevice")}
              subtitle={t("transfer.lending.supply.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingSupplyConnectDevice}
        component={LendingSupplyConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.lending.supply.stepperHeader.connectDevice")}
              subtitle={t("transfer.lending.supply.stepperHeader.stepRange", {
                currentStep: "4",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingSupplyValidationSuccess}
        component={LendingSupplyValidationSuccess}
        options={{
          headerLeft: null,
          headerShown: false,
          headerRight: null,
          gestureSupplyd: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.LendingSupplyValidationError}
        component={LendingSupplyValidationError}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
