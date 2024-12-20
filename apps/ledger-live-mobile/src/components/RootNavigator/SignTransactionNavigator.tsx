import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { ScreenName } from "~/const";
import SignTransactionSummary from "~/screens/SendFunds/04-Summary";
import SelectDevice from "~/screens/SelectDevice";
import SignTransactionConnectDevice from "~/screens/SignTransaction/02-ConnectDevice";
import SignTransactionValidationError from "~/screens/SignTransaction/03-ValidationError";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { SignTransactionNavigatorParamList } from "./types/SignTransactionNavigator";

const Stack = createStackNavigator<SignTransactionNavigatorParamList>();

const totalSteps = "3";
export default function SignTransactionNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <DomainServiceProvider>
      <Stack.Navigator screenOptions={stackNavigationConfig}>
        <Stack.Screen
          name={ScreenName.SignTransactionSummary}
          component={SignTransactionSummary}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.summary")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SignTransactionSelectDevice}
          component={SelectDevice}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.selectDevice")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "2",
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SignTransactionConnectDevice}
          component={SignTransactionConnectDevice}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.connectDevice")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "2",
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SignTransactionValidationError}
          component={SignTransactionValidationError}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </DomainServiceProvider>
  );
}
