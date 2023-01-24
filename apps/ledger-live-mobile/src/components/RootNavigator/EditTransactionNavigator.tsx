import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { MethodSelection } from "../../screens/EditTransaction/methodSelection";
import { EthereumEditTransactionParamList } from "./types/EthereumEditTransactionNavigator";
import { SpeedupTransaction } from "../../screens/EditTransaction/speedup";
import { CancelTransaction } from "../../screens/EditTransaction/cancel";

const totalSteps = "5";

const Stack = createStackNavigator<EthereumEditTransactionParamList>();

export default function EditTransactionNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.EditTransactionOptions}
        component={MethodSelection}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("editTx.header")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.SpeedUpTransaction}
        component={SpeedupTransaction}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("editTx.header")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CancelTransaction}
        component={CancelTransaction}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("editTx.header")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}
