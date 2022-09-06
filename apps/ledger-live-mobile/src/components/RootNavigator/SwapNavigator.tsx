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
  StateSelect,
} from "../../screens/Swap/index";
import { SwapFormNavigator } from "./SwapFormNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
// eslint-disable-next-line import/no-cycle
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
        name="SwapTab"
        component={SwapFormNavigator}
        {...noNanoBuyNanoWallScreenOptions}
        options={{
          ...noNanoBuyNanoWallScreenOptions.options,
          title: t("transfer.swap2.form.title"),
          headerLeft: () => null,
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
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name="SelectCurrency"
        component={SelectCurrency}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.select.to.title")} />
          ),
          headerRight: () => null,
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
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name="SelectFees"
        component={SelectFees}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.details.label.fees")} />
          ),
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name="Login"
        component={Login}
        options={({ route }) => ({
          headerTitle: getProviderName(route.params.provider),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name="KYC"
        component={KYC}
        options={({ route }) => ({
          headerTitle: getProviderName(route.params.provider),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name="SwapKYCStates"
        component={StateSelect}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap.kyc.states")} />
          ),
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name="MFA"
        component={MFA}
        options={({ route }) => ({
          headerTitle: getProviderName(route.params.provider),
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={"PendingOperation"}
        component={PendingOperation}
        options={{
          headerTitle: t("transfer.swap.title"),
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={"OperationDetails"}
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

const Stack = createStackNavigator<SwapNavParamList>();
