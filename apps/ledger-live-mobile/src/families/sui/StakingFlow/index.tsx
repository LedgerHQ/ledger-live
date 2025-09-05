import { SuiValidator } from "@ledgerhq/live-common/families/sui/types";
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
import StakingAmount from "../shared/02-SelectAmount";
import SelectValidator from "./SelectValidator";
import StakingSummary from "./02-Summary";
import StakingValidationError from "./04-ValidationError";
import StakingValidationSuccess from "./04-ValidationSuccess";
import { SuiStakingFlowParamList } from "./types";

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
        name={ScreenName.SuiStakingValidator}
        component={StakingSummary}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("delegation.delegate")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SuiStakingValidatorSelect}
        component={SelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.SuiStakingAmount}
        component={StakingAmount}
        options={({ route }: { route: { params: { validator: SuiValidator } } }) => ({
          headerRight: undefined,
          headerTitle: () => (
            <StepHeader
              title={route.params.validator.name}
              subtitle={t("sui.staking.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.SuiStakingSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("sui.staking.stepperHeader.selectDevice")}
              subtitle={t("sui.staking.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SuiStakingConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("sui.staking.stepperHeader.connectDevice")}
              subtitle={t("sui.staking.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SuiStakingValidationError}
        component={StakingValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.SuiStakingValidationSuccess}
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

const Stack = createNativeStackNavigator<SuiStakingFlowParamList>();
