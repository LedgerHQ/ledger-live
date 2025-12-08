import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import ClaimRewardsSelectReward from "./SelectReward";
import ClaimRewardsClaim from "./Claim";
import ClaimRewardsValidationError from "./ValidationError";
import ClaimRewardsValidationSuccess from "./ValidationSuccess";
import type { HederaClaimRewardsFlowParamList } from "./types";

const totalSteps = "3";

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
        name={ScreenName.HederaClaimRewardsSelectReward}
        component={ClaimRewardsSelectReward}
        options={() => ({
          headerLeft: () => null,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("hedera.claimRewards.stepperHeader.selectReward")}
              subtitle={t("hedera.claimRewards.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.HederaClaimRewardsClaim}
        component={ClaimRewardsClaim}
        options={() => ({
          headerTitle: () => <StepHeader title={t("hedera.claimRewards.stepperHeader.claim")} />,
        })}
      />
      <Stack.Screen
        name={ScreenName.HederaClaimRewardsSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.claimRewards.stepperHeader.selectDevice")}
              subtitle={t("hedera.claimRewards.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaClaimRewardsConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("hedera.claimRewards.stepperHeader.connectDevice")}
              subtitle={t("hedera.claimRewards.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaClaimRewardsValidationError}
        component={ClaimRewardsValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaClaimRewardsValidationSuccess}
        component={ClaimRewardsValidationSuccess}
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

export { ClaimRewardsFlow as component, options };

const Stack = createNativeStackNavigator<HederaClaimRewardsFlowParamList>();
