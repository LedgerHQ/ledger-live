// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import {
  getStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import ClaimRewardsSelectValidator from "./01-SelectValidator";
import ClaimRewardsMethod from "./02-SelectMethod.js";
import ClaimRewardsSelectDevice from "../../../screens/SelectDevice";
import ClaimRewardsConnectDevice from "../../../screens/ConnectDevice";
import ClaimRewardsValidationError from "./04-ValidationError";
import ClaimRewardsValidationSuccess from "./04-ValidationSuccess";

const totalSteps = "3";

function ClaimRewardsFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CosmosClaimRewardsValidator}
        component={ClaimRewardsSelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.claimRewards.stepperHeader.validator")}
              subtitle={t("cosmos.claimRewards.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
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
        name={ScreenName.CosmosClaimRewardsMethod}
        component={ClaimRewardsMethod}
        options={{
          headerTitle: () => (
            <StepHeader title={t("cosmos.claimRewards.stepperHeader.method")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosClaimRewardsSelectDevice}
        component={ClaimRewardsSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.claimRewards.stepperHeader.selectDevice")}
              subtitle={t("cosmos.claimRewards.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosClaimRewardsConnectDevice}
        component={ClaimRewardsConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.claimRewards.stepperHeader.connectDevice")}
              subtitle={t("cosmos.claimRewards.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosClaimRewardsValidationError}
        component={ClaimRewardsValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosClaimRewardsValidationSuccess}
        component={ClaimRewardsValidationSuccess}
        options={{
          headerLeft: null,
          headerRight: null,
          headerTitle: null,
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

const Stack = createStackNavigator();
