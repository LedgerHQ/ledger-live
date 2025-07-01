import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import UnstakingAmount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import UnstakingValidationError from "./03-ValidationError";
import UnstakingValidationSuccess from "./03-ValidationSuccess";
import { AptosUnstakingFlowParamList } from "./types";

const totalSteps = "3";

function UnstakingFlow() {
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
        name={ScreenName.AptosUnstakingAmount}
        component={UnstakingAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={route.params?.stakingPosition?.validator?.address ?? ""}
              subtitle={t("aptos.unstaking.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.AptosUnstakingSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("aptos.staking.stepperHeader.selectDevice")}
              subtitle={t("aptos.staking.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AptosUnstakingConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("aptos.staking.stepperHeader.connectDevice")}
              subtitle={t("aptos.staking.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AptosUnstakingValidationError}
        component={UnstakingValidationError}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AptosUnstakingValidationSuccess}
        component={UnstakingValidationSuccess}
        options={{
          headerLeft: undefined,
          headerTitle: "",
          headerRight: undefined,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { UnstakingFlow as component, options };

const Stack = createStackNavigator<AptosUnstakingFlowParamList>();
