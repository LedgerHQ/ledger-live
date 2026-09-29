import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig, bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import Amount from "./Amount";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { AleoUnbondFlowParamList } from "./types";

const Stack = createNativeStackNavigator<AleoUnbondFlowParamList>();

function AmountHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.unbond.stepperHeader.amount")} />;
}

function SelectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.unbond.stepperHeader.selectDevice")} />;
}

function ConnectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.unbond.stepperHeader.connectDevice")} />;
}

function UnbondFlow() {
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.AleoUnbondAmount}
        component={Amount}
        options={{
          headerTitle: AmountHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoUnbondSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: SelectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoUnbondConnectDevice}
        component={ConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: ConnectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoUnbondValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.AleoUnbondValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };
export { UnbondFlow as component, options };
