import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import type { SendFundsNavigatorStackParamList } from "./types/SendFundsNavigator";
import { register } from "react-native-bundle-splitter";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import SendWorkflow from "LLM/features/Send";

const SendCoin = register({ loader: () => import("~/screens/SelectAccount") });
const SendSelectRecipient = register({
  loader: () => import("~/screens/SendFunds/02-SelectRecipient"),
});
const SendAmountCoin = register({ loader: () => import("~/screens/SendFunds/03a-AmountCoin") });
const SendSummary = register({ loader: () => import("~/screens/SendFunds/04-Summary") });
const SelectDevice = register({ loader: () => import("~/screens/SelectDevice") });
const SendConnectDevice = register({ loader: () => import("~/screens/ConnectDevice") });
const SendValidationSuccess = register({
  loader: () => import("~/screens/SendFunds/07-ValidationSuccess"),
});
const SendBroadcastError = register({
  loader: () => import("~/screens/SendFunds/07-SendBroadcastError"),
});
const SendValidationError = register({
  loader: () => import("~/screens/SendFunds/07-ValidationError"),
});

const totalSteps = "5";

const Stack = createStackNavigator<SendFundsNavigatorStackParamList>();

export default function SendFundsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const newSendFlow = useFeature("newSendFlow");

  return (
    <DomainServiceProvider>
      <Stack.Navigator screenOptions={stackNavigationConfig}>
        <Stack.Screen
          name={ScreenName.SendCoin}
          component={SendCoin}
          options={{
            headerTitle: () => (
              <StepHeader
                testID="send-header-step1-title"
                title={t("send.stepperHeader.selectAccount")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps,
                })}
              />
            ),
          }}
          initialParams={{
            next: !newSendFlow?.enabled ? ScreenName.SendSelectRecipient : ScreenName.NewSendFlow,
            category: "SendFunds",
            notEmptyAccounts: true,
            minBalance: 0,
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
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SendAmountCoin}
          component={SendAmountCoin}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.selectAmount")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "3",
                  totalSteps,
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
                  totalSteps,
                })}
              />
            ),
          }}
          initialParams={{
            currentNavigation: ScreenName.SendSummary,
            nextNavigation: ScreenName.SendSelectDevice,
          }}
        />
        <Stack.Screen
          name={ScreenName.SendSelectDevice}
          component={SelectDevice}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.selectDevice")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "5",
                  totalSteps,
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
                  totalSteps,
                })}
              />
            ),
          }}
          initialParams={{
            analyticsPropertyFlow: "send",
          }}
        />
        <Stack.Screen
          name={ScreenName.SendValidationSuccess}
          component={SendValidationSuccess}
          options={{
            headerLeft: undefined,
            headerShown: false,
            headerRight: undefined,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name={ScreenName.SendBroadcastError}
          component={SendBroadcastError}
          options={{ headerLeft: () => null, headerTitle: () => null }}
        />
        <Stack.Screen
          name={ScreenName.SendValidationError}
          component={SendValidationError}
          options={{
            headerShown: false,
          }}
        />
        {/* ---- New Send flow screens */}
        <Stack.Screen
          name={ScreenName.NewSendFlow}
          component={SendWorkflow}
          options={{
            headerShown: false,
            // eslint-disable-next-line i18next/no-literal-string
            headerTitle: () => (
              <StepHeader
                testID="send-header-step1-title"
                title={"New Send flow"}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps: "1",
                })}
              />
            ),
          }}
        />
      </Stack.Navigator>
    </DomainServiceProvider>
  );
}
