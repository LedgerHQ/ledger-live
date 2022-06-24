import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import {
  SwapNavParamList,
  SelectAccount,
  SelectCurrency,
} from "../../screens/Swap";
import { SwapFormNavigator } from "./SwapFormNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
// import SwapPendingOperation from "../../screens/Swap/PendingOperation";
// import SwapError from "../../screens/Swap/Error";
// import SwapKYC from "../../screens/Swap/KYC";
// import SwapKYCStates from "../../screens/Swap/KYC/StateSelect";

export default function SwapNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{ ...stackNavigationConfig, headerShown: true }}
    >
      <Stack.Screen
        name="Swap"
        component={SwapFormNavigator}
        options={{
          title: t("transfer.swap2.form.title"),
        }}
      />
      <Stack.Screen
        name="SwapSelectAccount"
        component={SelectAccount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={
                route.params.target === "from"
                  ? t("transfer.swap.form.from")
                  : t("transfer.swap.form.to")
              }
            />
          ),
          headerRight: undefined,
        })}
      />
      <Stack.Screen
        name="SwapSelectCurrency"
        component={SelectCurrency}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.form.to")} />,
          headerRight: undefined,
        }}
      />
      {/* <Stack.Screen
        name={ScreenName.SwapKYC}
        component={SwapKYC}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapKYCStates}
        component={SwapKYCStates}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap.kyc.states")} />
          ),
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapError}
        component={SwapError}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapPendingOperation}
        component={SwapPendingOperation}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerLeft: null,
        }}
      /> */}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<SwapNavParamList>();
