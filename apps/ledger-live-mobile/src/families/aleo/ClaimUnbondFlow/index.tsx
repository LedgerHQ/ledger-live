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
import type { AleoClaimUnbondFlowParamList } from "./types";

const Stack = createNativeStackNavigator<AleoClaimUnbondFlowParamList>();

function AmountHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.claim.stepperHeader.amount")} />;
}

function SelectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.claim.stepperHeader.selectDevice")} />;
}

function ConnectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.claim.stepperHeader.connectDevice")} />;
}

function ClaimUnbondFlow() {
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
        name={ScreenName.AleoClaimUnbondAmount}
        component={Amount}
        options={{
          headerTitle: AmountHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoClaimUnbondSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: SelectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoClaimUnbondConnectDevice}
        component={ConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: ConnectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoClaimUnbondValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.AleoClaimUnbondValidationError}
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
export { ClaimUnbondFlow as component, options };
