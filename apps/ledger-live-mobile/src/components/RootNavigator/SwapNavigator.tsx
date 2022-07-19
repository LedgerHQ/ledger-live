import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import {
  SwapNavParamList,
  SelectAccount,
  SelectCurrency,
  SelectProvider,
  SelectFees,
  Login,
  KYC,
  MFA,
  PendingOperation,
  OperationDetails,
} from "../../screens/Swap/index";
import { SwapFormNavigator } from "./SwapFormNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
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
            <StepHeader
              title={t(`transfer.swap2.form.select.${target}.title`)}
            />
          ),
          headerRight: undefined,
        })}
      />

      <Stack.Screen
        name="SelectCurrency"
        component={SelectCurrency}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.select.to.title")} />
          ),
          headerRight: undefined,
        }}
      />

      <Stack.Screen
        name="SelectProvider"
        component={SelectProvider}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("transfer.swap2.form.details.label.provider")}
            />
          ),
          headerRight: undefined,
        }}
      />

      <Stack.Screen
        name="SelectFees"
        component={SelectFees}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.details.label.fees")} />
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

      <Stack.Screen
        name={"PendingOperation"}
        component={PendingOperation}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={"OperationDetails"}
        component={OperationDetails}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerLeft: undefined,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<SwapNavParamList>();
