// @flow

import React from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "../../const";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import ConnectDevice from "../../screens/ClaimRewards/01-ConnectDevice";
import Validation from "../../screens/ClaimRewards/02-Validation";
import ValidationSuccess from "../../screens/ClaimRewards/02-ValidationSuccess";
import ValidationError from "../../screens/ClaimRewards/02-ValidationError";
import StepHeader from "../StepHeader";

export default function ClaimRewardsNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.ClaimRewardsConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("claimReward.stepperHeader.connectDevice")}
              subtitle={t("claimReward.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "2",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ClaimRewardsValidation}
        component={Validation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("claimReward.stepperHeader.verification")}
              subtitle={t("claimReward.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "2",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ClaimRewardsValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ClaimRewardsValidationError}
        component={ValidationError}
        options={{ headerTitle: null }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
