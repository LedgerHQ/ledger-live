// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";
import RequestAccountSelectCrypto from "../../screens/RequestAccount/01-SelectCrypto";
import RequestAccountSelectAccount from "../../screens/RequestAccount/02-SelectAccount";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import AddAccountsNavigator from "./AddAccountsNavigator";
import StepHeader from "../StepHeader";

const totalSteps = "2";

export default function RequestAccountNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [
    colors,
  ]);

  return (
    <Stack.Navigator
      headerMode="float"
      screenOptions={{
        ...stackNavConfig,
      }}
    >
      <Stack.Screen
        name={ScreenName.RequestAccountsSelectCrypto}
        component={RequestAccountSelectCrypto}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("requestAccount.stepperHeader.selectCrypto")}
              subtitle={t("requestAccount.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.RequestAccountsSelectAccount}
        component={RequestAccountSelectAccount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("requestAccount.stepperHeader.selectAccount")}
              subtitle={t("requestAccount.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={NavigatorName.RequestAccountsAddAccounts}
        component={AddAccountsNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
