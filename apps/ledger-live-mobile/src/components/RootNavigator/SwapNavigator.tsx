import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { getProviderName } from "@ledgerhq/live-common/lib/exchange/swap/utils";
import {
  SwapNavParamList,
  SelectAccount,
  SelectCurrency,
  Login,
  KYC,
  MFA,
} from "../../screens/Swap";
import { SwapFormNavigator } from "./SwapFormNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
// import SwapPendingOperation from "../../screens/Swap/PendingOperation";
// import SwapError from "../../screens/Swap/Error";
// import SwapKYC from "../../screens/Swap/KYC";
// import SwapKYCStates from "../../screens/Swap/KYC/StateSelect";
// import SwapPendingOperation from "../../screens/Swap/PendingOperation";
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";

export default function SwapNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{ ...stackNavigationConfig, headerShown: true }}
    >
      <Stack.Screen
        name="Swap"
        component={SwapFormNavigator}
        {...noNanoBuyNanoWallScreenOptions}
        options={{
          ...noNanoBuyNanoWallScreenOptions.options,
          title: t("transfer.swap2.form.title"),
        }}
      />
      <Stack.Screen
        name="SelectAccount"
        component={SelectAccount}
        options={({
          route: {
            params: { target },
          },
        }) => ({
          headerTitle: () => (
            <StepHeader title={t(`transfer.swap2.form.edit.${target}.title`)} />
          ),
          headerRight: undefined,
        })}
      />
      <Stack.Screen
        name="SelectCurrency"
        component={SelectCurrency}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.edit.to.title")} />
          ),
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader title={getProviderName(route.params.provider)} />
          ),
          headerRight: undefined,
        })}
      />
      <Stack.Screen
        name="KYC"
        component={KYC}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader title={getProviderName(route.params.provider)} />
          ),
          headerRight: undefined,
        })}
      />
      <Stack.Screen
        name="MFA"
        component={MFA}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader title={getProviderName(route.params.provider)} />
          ),
          headerRight: undefined,
        })}
      />
      {/* <Stack.Screen
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
