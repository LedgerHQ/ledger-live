// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import ReceiveConfirmation from "../../screens/ReceiveFunds/03-Confirmation";
import ReceiveConnectDevice from "../../screens/ReceiveFunds/02-ConnectDevice";
import ReceiveSelectAccount from "../../screens/ReceiveFunds/01-SelectAccount";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

const totalSteps = "3";

export default function ReceiveFundsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      headerMode="float"
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.ReceiveSelectAccount}
        component={ReceiveSelectAccount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.receive.headerTitle")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ReceiveConnectDevice}
        component={ReceiveConnectDevice}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={t(route.params?.title ?? "transfer.receive.titleDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("account.receive")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
