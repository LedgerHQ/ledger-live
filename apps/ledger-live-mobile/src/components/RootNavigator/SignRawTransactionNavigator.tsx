import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { ScreenName } from "~/const";
import SelectDevice from "~/screens/SelectDevice";
import SignRawTransactionConnectDevice from "~/screens/SignRawTransaction/02-ConnectDevice";
import SignRawTransactionValidationError from "~/screens/SignRawTransaction/03-ValidationError";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { SignRawTransactionNavigatorParamList } from "./types/SignRawTransactionNavigator";

const Stack = createNativeStackNavigator<SignRawTransactionNavigatorParamList>();

const totalSteps = "2";
export default function SignRawTransactionNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <DomainServiceProvider>
      <Stack.Navigator screenOptions={stackNavigationConfig}>
        <Stack.Screen
          name={ScreenName.SignRawTransactionSelectDevice}
          component={SelectDevice}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.selectDevice")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SignRawTransactionConnectDevice}
          component={SignRawTransactionConnectDevice}
          options={{
            headerTitle: () => (
              <StepHeader
                title={t("send.stepperHeader.connectDevice")}
                subtitle={t("send.stepperHeader.stepRange", {
                  currentStep: "1",
                  totalSteps,
                })}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.SignRawTransactionValidationError}
          component={SignRawTransactionValidationError}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </DomainServiceProvider>
  );
}
