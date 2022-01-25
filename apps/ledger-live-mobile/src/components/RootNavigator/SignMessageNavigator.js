// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import SignSummary from "../../screens/SignMessage/01-Summary";
import SelectDevice from "../../screens/SelectDevice";
import SignConnectDevice from "../../screens/SignMessage/03-ConnectDevice";
import SignValidationSuccess from "../../screens/SignMessage/04-ValidationSuccess";
import SignValidationError from "../../screens/SignMessage/04-ValidationError";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

const totalSteps = "3";

export default function SignMessageNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [
    colors,
  ]);
  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.SignSummary}
        component={SignSummary}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("walletconnect.stepperHeader.summary")}
              subtitle={t("walletconnect.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SignSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("walletconnect.stepperHeader.selectDevice")}
              subtitle={t("walletconnect.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SignConnectDevice}
        component={SignConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("walletconnect.stepperHeader.connectDevice")}
              subtitle={t("walletconnect.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SignValidationSuccess}
        component={SignValidationSuccess}
        options={{
          headerLeft: null,
          headerShown: false,
          headerRight: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.SignValidationError}
        component={SignValidationError}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
