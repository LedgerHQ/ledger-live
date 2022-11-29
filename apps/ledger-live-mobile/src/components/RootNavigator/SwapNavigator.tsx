import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import {
  SelectAccount,
  SelectCurrency,
  SelectProvider,
  SelectFees,
  Login,
  KYC,
  MFA,
  PendingOperation,
  OperationDetails,
  StateSelect,
} from "../../screens/Swap/index";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";
import { SwapNavigatorParamList } from "./types/SwapNavigator";
import { ScreenName } from "../../const";
import SwapFormNavigator from "./SwapFormNavigator";

const Stack = createStackNavigator<SwapNavigatorParamList>();

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
        name={ScreenName.SwapTab}
        component={SwapFormNavigator}
        {...noNanoBuyNanoWallScreenOptions}
        options={{
          ...(noNanoBuyNanoWallScreenOptions as { options: object }).options,
          title: t("transfer.swap2.form.title"),
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectAccount}
        component={SelectAccount}
        options={({
          route: {
            params: { target },
          },
        }) => ({
          headerTitle: () => (
            <StepHeader
              title={t(`transfer.swap2.form.select.${target}.title`)}
            />
          ),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectCurrency}
        component={SelectCurrency}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.select.to.title")} />
          ),
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectProvider}
        component={SelectProvider}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.swap2.form.details.label.provider")}
            />
          ),
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectFees}
        component={SelectFees}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.details.label.fees")} />
          ),
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapLogin}
        component={Login}
        options={({ route }) => ({
          headerTitle: getProviderName(route.params.provider),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapKYC}
        component={KYC}
        options={({ route }) => ({
          headerTitle: getProviderName(route.params.provider),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapKYCStates}
        component={StateSelect}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap.kyc.states")} />
          ),
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapMFA}
        component={MFA}
        options={({ route }) => ({
          headerTitle: getProviderName(route.params.provider),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapPendingOperation}
        component={PendingOperation}
        options={{
          headerTitle: t("transfer.swap.title"),
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapOperationDetails}
        component={OperationDetails}
        options={({ route }) => ({
          headerTitle: t("transfer.swap.title"),
          headerLeft: route.params?.fromPendingOperation
            ? () => null
            : undefined,
        })}
      />
    </Stack.Navigator>
  );
}
