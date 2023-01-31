import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { MethodSelection } from "../../screens/EditTransaction/MethodSelection";
import { EthereumEditTransactionParamList } from "./types/EthereumEditTransactionNavigator";
import { SpeedupTransaction } from "../../screens/EditTransaction/Speedup";
import { CancelTransaction } from "../../screens/EditTransaction/Cancel";
import SendSummary from "../../screens/SendFunds/04-Summary";
// import SelectDevice from "../SelectDevice";

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
          headerTitle: () => <StepHeader title={t("editTx.header")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.SpeedUpTransaction}
        component={SpeedupTransaction}
        options={{
          headerTitle: () => <StepHeader title={t("editTx.header")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.CancelTransaction}
        component={CancelTransaction}
        options={{
          headerTitle: () => <StepHeader title={t("editTx.header")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.SendSummary}
        component={SendSummary}
        initialParams={{
          currentNavigation: ScreenName.SendSummary,
          nextNavigation: ScreenName.SendSelectDevice,
        }}
      />
      {/* <Stack.Screen
        name={ScreenName.SendSelectDevice}
        component={SelectDevice}
      />
      <Stack.Screen
        name={ScreenName.SendConnectDevice}
        component={SendConnectDevice}
        options={{}}
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
      /> */}
    </Stack.Navigator>
  );
}
