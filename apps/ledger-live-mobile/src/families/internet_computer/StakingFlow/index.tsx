import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import StakingStarted from "./01-Started";
import StakingAmount from "./02-Amount";
import StakingValidationError from "./03-ValidationError";
import StakingValidationSuccess from "./03-ValidationSuccess";
import { InternetComputerStakingFlowParamList } from "./types";

const totalSteps = "3";

function StakingFlow() {
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
        name={ScreenName.InternetComputerStakingStarted}
        component={StakingStarted}
        options={{
          headerTitle: () => <StepHeader title={t("icp.staking.flow.steps.starter.title")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingAmount}
        component={StakingAmount}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.staking.flow.steps.amount.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("icp.staking.flow.steps.device.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingConnectDevice}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={ConnectDevice as any}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.staking.flow.steps.connect.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingValidationError}
        component={StakingValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerStakingValidationSuccess}
        component={StakingValidationSuccess}
        options={{
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { StakingFlow as component, options };

const Stack = createNativeStackNavigator<InternetComputerStakingFlowParamList>();
