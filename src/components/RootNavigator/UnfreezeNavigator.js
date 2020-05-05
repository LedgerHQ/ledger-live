// @flow

import React from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "../../const";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Amount from "../../screens/UnfreezeFunds/01-Amount";
import ConnectDevice from "../../screens/UnfreezeFunds/02-ConnectDevice";
import Validation from "../../screens/UnfreezeFunds/03-Validation";
import ValidationSuccess from "../../screens/UnfreezeFunds/03-ValidationSuccess";
import ValidationError from "../../screens/UnfreezeFunds/03-ValidationError";
import StepHeader from "../StepHeader";

export default function UnfreezeNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.UnfreezeAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("unfreeze.stepperHeader.selectAmount")}
              subtitle={t("unfreeze.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.UnfreezeConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("unfreeze.stepperHeader.connectDevice")}
              subtitle={t("unfreeze.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.UnfreezeValidation}
        component={Validation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("unfreeze.stepperHeader.verification")}
              subtitle={t("unfreeze.stepperHeader.stepRange", {
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
        name={ScreenName.UnfreezeValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.UnfreezeValidationError}
        component={ValidationError}
        options={{ headerTitle: null }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
