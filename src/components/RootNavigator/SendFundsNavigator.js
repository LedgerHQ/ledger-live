// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import SendFundsMain from "../../screens/SendFunds/01-SelectAccount";
import SendSelectRecipient from "../../screens/SendFunds/02-SelectRecipient";
import SendAmount from "../../screens/SendFunds/03-Amount";
import SendSummary from "../../screens/SendFunds/04-Summary";
import SendConnectDevice from "../../screens/SendFunds/05-ConnectDevice";
import SendValidation from "../../screens/SendFunds/06-Validation";
import SendValidationSuccess from "../../screens/SendFunds/07-ValidationSuccess";
import SendValidationError from "../../screens/SendFunds/07-ValidationError";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

export default function SendFundsNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.SendFundsMain}
        component={SendFundsMain}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.selectAccount")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "6",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SendSelectRecipient}
        component={SendSelectRecipient}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.recipientAddress")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "6",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SendAmount}
        component={SendAmount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.selectAmount")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "6",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SendSummary}
        component={SendSummary}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.summary")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "4",
                totalSteps: "6",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SendConnectDevice}
        component={SendConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.connectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "5",
                totalSteps: "6",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SendValidation}
        component={SendValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.verification")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "6",
                totalSteps: "6",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.SendValidationSuccess}
        component={SendValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.SendValidationError}
        component={SendValidationError}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
