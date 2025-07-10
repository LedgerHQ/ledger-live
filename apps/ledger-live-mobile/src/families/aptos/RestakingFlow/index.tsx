import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import RestakingAmount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import RestakingValidationError from "./03-ValidationError";
import RestakingValidationSuccess from "./03-ValidationSuccess";
import { AptosRestakingFlowParamList } from "./types";

const totalSteps = "3";

function RestakingFlow() {
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
        name={ScreenName.AptosRestakingAmount}
        component={RestakingAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={route.params?.stakingPosition?.validator?.address ?? ""}
              subtitle={t("aptos.restaking.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.AptosRestakingSelectDevice}
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
        name={ScreenName.AptosRestakingConnectDevice}
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
        name={ScreenName.AptosRestakingValidationError}
        component={RestakingValidationError}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AptosRestakingValidationSuccess}
        component={RestakingValidationSuccess}
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

export { RestakingFlow as component, options };

const Stack = createStackNavigator<AptosRestakingFlowParamList>();
