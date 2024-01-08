import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import {
  getStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../../navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import ClaimRewardsInfo from "./01-Info";
import ClaimRewardsStarted from "./01-Started";
import ClaimRewardsSelectDevice from "~/screens/SelectDevice";
import ClaimRewardsConnectDevice from "~/screens/ConnectDevice";
import ClaimRewardsValidation from "./03-Validation";
import ClaimRewardsValidationError from "./03-ValidationError";
import ClaimRewardsValidationSuccess from "./03-ValidationSuccess";
import type { AlgorandClaimRewardsFlowParamList } from "./type";

function ClaimRewardsFlow() {
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
        name={ScreenName.AlgorandClaimRewardsStarted}
        component={ClaimRewardsStarted}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.claimRewards.stepperHeader.starter")}
              subtitle={t("algorand.claimRewards.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: () => null,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandClaimRewardsSelectDevice}
        component={ClaimRewardsSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.claimRewards.stepperHeader.connectDevice")}
              subtitle={t("algorand.claimRewards.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandClaimRewardsConnectDevice}
        component={ClaimRewardsConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.claimRewards.stepperHeader.connectDevice")}
              subtitle={t("algorand.claimRewards.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandClaimRewardsSummary}
        component={ClaimRewardsValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("algorand.claimRewards.stepperHeader.verification")}
              subtitle={t("algorand.claimRewards.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: undefined,
          headerRight: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandClaimRewardsValidationError}
        component={ClaimRewardsValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandClaimRewardsValidationSuccess}
        component={ClaimRewardsValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AlgorandClaimRewardsInfo}
        component={ClaimRewardsInfo}
        options={{
          headerTitle: () => <StepHeader title={t("algorand.claimRewards.stepperHeader.info")} />,
          headerLeft: () => null,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { ClaimRewardsFlow as component, options };
const Stack = createStackNavigator<AlgorandClaimRewardsFlowParamList>();
