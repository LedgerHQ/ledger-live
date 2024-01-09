import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import WithdrawAmount from "./WithdrawAmount";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";
import { CeloWithdrawFlowParamList } from "./types";

const totalSteps = "3"; // Withdraw, Device, Confirmation

function WithdrawFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CeloWithdrawAmount}
        component={WithdrawAmount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.withdraw.title")}
              subtitle={t("celo.vote.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.CeloWithdrawSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.lock.stepperHeader.selectDevice")}
              subtitle={t("celo.lock.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloWithdrawConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.lock.stepperHeader.connectDevice")}
              subtitle={t("celo.lock.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.CeloWithdrawValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloWithdrawValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { WithdrawFlow as component, options };

const Stack = createStackNavigator<CeloWithdrawFlowParamList>();
