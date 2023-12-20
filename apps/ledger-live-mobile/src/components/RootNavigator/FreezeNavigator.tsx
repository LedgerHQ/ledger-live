import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import Info from "~/screens/FreezeFunds/01-Info";
import Amount from "~/screens/FreezeFunds/02-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ValidationSuccess from "~/screens/FreezeFunds/04-ValidationSuccess";
import ValidationError from "~/screens/FreezeFunds/04-ValidationError";
import StepHeader from "../StepHeader";
import { FreezeNavigatorParamList } from "./types/FreezeNavigator";

const Stack = createStackNavigator<FreezeNavigatorParamList>();

const totalSteps = "3";
export default function FreezeNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.FreezeInfo}
        component={Info}
        options={{
          headerTitle: () => <StepHeader title={t("freeze.stepperHeader.info")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.FreezeAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("freeze.stepperHeader.selectAmount")}
              subtitle={t("freeze.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.FreezeSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("freeze.stepperHeader.selectDevice")}
              subtitle={t("freeze.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.FreezeConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("freeze.stepperHeader.connectDevice")}
              subtitle={t("freeze.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.FreezeValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.FreezeValidationError}
        component={ValidationError}
        options={{
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}
