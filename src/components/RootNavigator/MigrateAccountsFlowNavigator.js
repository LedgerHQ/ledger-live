// @flow
import React from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { Trans } from "react-i18next";
import { ScreenName } from "../../const";
import MigrateAccountsOverview from "../../screens/MigrateAccounts/01-Overview";
import MigrateAccountsConnectDevice from "../../screens/MigrateAccounts/02-ConnectDevice";
import MigrateAccountsProgress from "../../screens/MigrateAccounts/03-Progress";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

export default function MigrateAccountsFlowNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...closableStackNavigatorConfig,
        headerShown: false,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.MigrateAccountsOverview}
        component={MigrateAccountsOverview}
        options={{
          headerTitle: () => (
            <StepHeader
              title={<Trans i18nKey="migrateAccounts.overview.headerTitle" />}
              subtitle={
                <Trans
                  i18nKey="send.stepperHeader.stepRange"
                  values={{
                    currentStep: "1",
                    totalSteps: "3",
                  }}
                />
              }
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.MigrateAccountsConnectDevice}
        component={MigrateAccountsConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={
                <Trans i18nKey="migrateAccounts.connectDevice.headerTitle" />
              }
              subtitle={
                <Trans
                  i18nKey="send.stepperHeader.stepRange"
                  values={{
                    currentStep: "2",
                    totalSteps: "3",
                  }}
                />
              }
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.MigrateAccountsProgress}
        component={MigrateAccountsProgress}
        options={{
          headerTitle: () => (
            <StepHeader
              title={<Trans i18nKey="migrateAccounts.progress.headerTitle" />}
              subtitle={
                <Trans
                  i18nKey="send.stepperHeader.stepRange"
                  values={{
                    currentStep: "3",
                    totalSteps: "3",
                  }}
                />
              }
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
