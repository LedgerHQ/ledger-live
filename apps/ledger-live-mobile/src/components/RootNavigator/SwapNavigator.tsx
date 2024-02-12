import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import {
  SelectAccount,
  SelectCurrency,
  SelectProvider,
  SelectFees,
  PendingOperation,
  OperationDetails,
} from "~/screens/Swap/index";
import { StackNavigatorProps } from "./types/helpers";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { SwapNavigatorParamList } from "./types/SwapNavigator";
import { ScreenName, NavigatorName } from "~/const";
import SwapFormNavigator from "./SwapFormNavigator";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";

const Stack = createStackNavigator<SwapNavigatorParamList>();

export default function SwapNavigator(
  props: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.Swap> | undefined,
) {
  const params = props?.route?.params?.params || {};
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: true }}>
      <Stack.Screen
        name={ScreenName.SwapTab}
        component={SwapFormNavigator}
        {...noNanoBuyNanoWallScreenOptions}
        options={{
          ...(noNanoBuyNanoWallScreenOptions as { options: object }).options,
          title: t("transfer.swap2.form.title"),
          headerLeft: () => null,
        }}
        initialParams={{
          ...params,
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
          headerTitle: () => <StepHeader title={t(`transfer.swap2.form.select.${target}.title`)} />,
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectCurrency}
        component={SelectCurrency}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.select.to.title")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectProvider}
        component={SelectProvider}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.details.label.provider")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectFees}
        component={SelectFees}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.details.label.fees")} />,
          headerRight: () => null,
        }}
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
          headerLeft: route.params?.fromPendingOperation ? () => null : undefined,
        })}
      />
    </Stack.Navigator>
  );
}
