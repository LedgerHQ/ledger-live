import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { MethodSelection } from "./MethodSelection";
import StepHeader from "~/components/StepHeader";
import { EditTransactionParamList } from "./EditTransactionParamList";
import EditTransactionSummary from "./EditTransactionSummary";
import { TransactionAlreadyValidatedError } from "./TransactionAlreadyValidatedError";
import SelectDevice from "~/screens/SelectDevice";
import SendConnectDevice from "~/screens/ConnectDevice";
import SendValidationSuccess from "~/screens/SendFunds/07-ValidationSuccess";
import SendValidationError from "~/screens/SendFunds/07-ValidationError";

const Stack = createStackNavigator<EditTransactionParamList>();

// TODO: would be better UX to change headerTitle based on selected edition mode
export default function EditTransactionNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.EvmEditTransactionMethodSelection}
        component={MethodSelection}
        options={{
          headerTitle: () => <StepHeader title={t("editTransaction.header")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.EditTransactionSummary}
        component={EditTransactionSummary}
        options={{
          headerTitle: () => <StepHeader title={t("editTransaction.header")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.SendSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => <StepHeader title={t("editTransaction.header")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.SendConnectDevice}
        component={SendConnectDevice}
        options={{
          headerTitle: () => <StepHeader title={t("editTransaction.header")} />,
        }}
        initialParams={{
          analyticsPropertyFlow: "send",
        }}
      />
      <Stack.Screen
        name={ScreenName.SendValidationSuccess}
        component={SendValidationSuccess}
        options={{
          headerLeft: undefined,
          headerShown: false,
          headerRight: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.SendValidationError}
        component={SendValidationError}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.TransactionAlreadyValidatedError}
        component={TransactionAlreadyValidatedError}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
