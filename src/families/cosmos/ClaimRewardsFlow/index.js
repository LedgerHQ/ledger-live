// @flow
import React from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import {
  closableStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import ClaimRewardsSelectValidator from "./01-SelectValidator";
import ClaimRewardsMethod from "./02-SelectMethod.js";
import ClaimRewardsConnectDevice from "./03-ConnectDevice";
import ClaimRewardsValidation from "./04-Validation";
import ClaimRewardsValidationError from "./04-ValidationError";
import ClaimRewardsValidationSuccess from "./04-ValidationSuccess";

function ClaimRewardsFlow() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...closableStackNavigatorConfig,
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
        name={ScreenName.CosmosClaimRewardsMethod}
        component={ClaimRewardsMethod}
        options={{
          headerTitle: () => (
            <StepHeader title={t("cosmos.claimRewards.stepperHeader.method")} />
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
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosClaimRewardsValidation}
        component={ClaimRewardsValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.claimRewards.stepperHeader.verification")}
              subtitle={t("cosmos.claimRewards.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
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

const Stack = createStackNavigator();
