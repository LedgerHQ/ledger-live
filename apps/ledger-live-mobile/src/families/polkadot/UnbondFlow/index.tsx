import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import Amount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ValidationSuccess from "./03-ValidationSuccess";
import ValidationError from "./03-ValidationError";
import type { PolkadotUnbondFlowParamList } from "./type";

const totalSteps = "3";

function UnbondFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.PolkadotUnbondAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.unbond.stepperHeader.amount")}
              subtitle={t("polkadot.unbond.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotUnbondSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.unbond.stepperHeader.selectDevice")}
              subtitle={t("polkadot.unbond.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotUnbondConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.unbond.stepperHeader.connectDevice")}
              subtitle={t("polkadot.unbond.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotUnbondValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotUnbondValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { UnbondFlow as component, options };
const Stack = createStackNavigator<PolkadotUnbondFlowParamList>();
