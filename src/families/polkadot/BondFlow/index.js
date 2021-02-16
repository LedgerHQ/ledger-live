// @flow

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";

import Started from "./01-Started";
import Amount from "./02-Amount";
import SelectDevice from "../../../screens/SelectDevice";
import ConnectDevice from "../../../screens/ConnectDevice";
import ValidationSuccess from "./04-ValidationSuccess";
import ValidationError from "./04-ValidationError";

const totalSteps = "3";

function BondFlow() {
  const { t } = useTranslation();

  const { colors } = useTheme();

  const stackNavigatorConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.PolkadotBondStarted}
        component={Started}
        options={{
          headerTitle: () => (
            <StepHeader title={t("polkadot.bond.stepperHeader.starter")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotBondAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.bond.stepperHeader.amount")}
              subtitle={t("polkadot.bond.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotBondSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.bond.stepperHeader.selectDevice")}
              subtitle={t("polkadot.bond.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotBondConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.bond.stepperHeader.connectDevice")}
              subtitle={t("polkadot.bond.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotBondValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: null,
          gestureEnabled: false,
          headerLeft: null,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotBondValidationError}
        component={ValidationError}
        options={{ headerTitle: null }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { BondFlow as component, options };

const Stack = createStackNavigator();
