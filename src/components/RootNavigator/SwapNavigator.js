// @flow

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import SwapSummary from "../../screens/Swap/Form/Summary";
import SwapError from "../../screens/Swap/Form/Error";
import SwapFormAmount from "../../screens/Swap/Form/Amount";
import SwapFormOrHistory from "../../screens/Swap/FormOrHistory";
import SwapOperationDetails from "../../screens/Swap/OperationDetails";
import { BackButton } from "../../screens/OperationDetails";
import SwapPendingOperation from "../../screens/Swap/Form/PendingOperation";
import SwapFormSelectCrypto from "../../screens/Swap/Form/SelectAccount/01-SelectCrypto";
import SwapFormSelectAccount from "../../screens/Swap/Form/SelectAccount/02-SelectAccount";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

export default function SwapNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.SwapFormOrHistory}
        component={SwapFormOrHistory}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap.landing.header")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapFormSelectCrypto}
        component={SwapFormSelectCrypto}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapFormSelectAccount}
        component={SwapFormSelectAccount}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapFormAmount}
        component={SwapFormAmount}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapSummary}
        component={SwapSummary}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
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
      <Stack.Screen
        name={ScreenName.SwapOperationDetails}
        component={SwapOperationDetails}
        options={({ navigation }) => ({
          headerTitle: () => <StepHeader title={t("transfer.swap.title")} />,
          headerLeft: () => <BackButton navigation={navigation} />,
          headerRight: null,
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
