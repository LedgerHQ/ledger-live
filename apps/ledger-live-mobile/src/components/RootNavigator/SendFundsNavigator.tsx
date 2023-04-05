import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { ScreenName } from "../../const";
import SendCoin from "../../screens/SelectAccount";
import SendCollection from "../../screens/SendFunds/01b-SelectCollection";
import SendNft from "../../screens/SendFunds/01c-SelectNft";
import SendSelectRecipient from "../../screens/SendFunds/02-SelectRecipient";
import SendAmountCoin from "../../screens/SendFunds/03a-AmountCoin";
import SendAmountNft from "../../screens/SendFunds/03b-AmountNft";
import SendSummary from "../../screens/SendFunds/04-Summary";
import SelectDevice from "../../screens/SelectDevice";
import SendConnectDevice from "../../screens/ConnectDevice";
import SendValidationSuccess from "../../screens/SendFunds/07-ValidationSuccess";
import SendValidationError from "../../screens/SendFunds/07-ValidationError";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import type { SendFundsNavigatorStackParamList } from "./types/SendFundsNavigator";

const totalSteps = "5";

const Stack = createStackNavigator<SendFundsNavigatorStackParamList>();

export default function SendFundsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
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
            next: ScreenName.SendSelectRecipient,
            category: "SendFunds",
            notEmptyAccounts: true,
            minBalance: 0,
          }}
        />
        <Stack.Screen
          name={ScreenName.SendCollection}
          component={SendCollection}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.selectCollection")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SendNft}
          component={SendNft}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.selectNft")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps,
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
          name={ScreenName.SendAmountNft}
          component={SendAmountNft}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.quantity")}
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
          name={ScreenName.SendValidationError}
          component={SendValidationError}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </DomainServiceProvider>
  );
}
