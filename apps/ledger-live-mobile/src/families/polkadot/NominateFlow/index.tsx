import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import Validators from "./01-Validators";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ValidationSuccess from "./03-ValidationSuccess";
import ValidationError from "./03-ValidationError";
import type { PolkadotNominateFlowParamList } from "./types";

const totalSteps = "3";

function NominateFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.PolkadotNominateSelectValidators}
        component={Validators}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.nominate.stepperHeader.validators")}
              subtitle={t("polkadot.nominate.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotNominateSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.nominate.stepperHeader.selectDevice")}
              subtitle={t("polkadot.nominate.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotNominateConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.nominate.stepperHeader.connectDevice")}
              subtitle={t("polkadot.nominate.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotNominateValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotNominateValidationError}
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
export { NominateFlow as component, options };
const Stack = createStackNavigator<PolkadotNominateFlowParamList>();
