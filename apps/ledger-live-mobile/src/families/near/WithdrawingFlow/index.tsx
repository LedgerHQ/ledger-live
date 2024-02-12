import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import WithdrawingAmount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import WithdrawingValidationError from "./03-ValidationError";
import WithdrawingValidationSuccess from "./03-ValidationSuccess";
import { NearWithdrawingFlowParamList } from "./types";

const totalSteps = "3";

function WithdrawingFlow() {
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
        name={ScreenName.NearWithdrawingAmount}
        component={WithdrawingAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={route.params?.stakingPosition?.validator?.validatorAddress ?? ""}
              subtitle={t("near.withdrawing.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.NearWithdrawingSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("near.staking.stepperHeader.selectDevice")}
              subtitle={t("near.staking.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.NearWithdrawingConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("near.staking.stepperHeader.connectDevice")}
              subtitle={t("near.staking.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.NearWithdrawingValidationError}
        component={WithdrawingValidationError}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.NearWithdrawingValidationSuccess}
        component={WithdrawingValidationSuccess}
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

export { WithdrawingFlow as component, options };

const Stack = createStackNavigator<NearWithdrawingFlowParamList>();
