import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import SwapError from "../../screens/Swap/Error";
import SwapKYC from "../../screens/Swap/KYC";
import SwapKYCStates from "../../screens/Swap/KYC/StateSelect";
import Swap from "../../screens/Swap/SwapEntry";
import SwapFormNavigator from "./SwapFormNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import SwapPendingOperation from "../../screens/Swap/PendingOperation";
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
      screenOptions={{ ...stackNavigationConfig, headerShown: false }}
    >
      <Stack.Screen
        name={ScreenName.Swap}
        component={Swap}
        options={{
          title: t("transfer.swap.landing.header"),
        }}
        {...noNanoBuyNanoWallScreenOptions}
      />
      <Stack.Screen
        name={ScreenName.SwapFormOrHistory}
        component={SwapFormNavigator}
        options={{
          title: t("transfer.swap.form.tab"),
        }}
      />
      <Stack.Screen
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
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
