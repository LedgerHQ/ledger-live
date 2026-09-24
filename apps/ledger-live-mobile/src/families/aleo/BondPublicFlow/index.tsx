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
import SelectValidator from "./SelectValidator";
import Amount from "./Amount";
import ValidationSuccess from "./ValidationSuccess";
import ValidationError from "./ValidationError";
import type { AleoBondPublicFlowParamList } from "./types";

const totalSteps = "2";

const Stack = createNativeStackNavigator<AleoBondPublicFlowParamList>();

function SelectValidatorHeader() {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t("aleo.bond.stepperHeader.validator")}
      subtitle={t("aleo.bond.stepperHeader.stepRange", { currentStep: "1", totalSteps })}
    />
  );
}

function AmountHeader() {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t("aleo.bond.stepperHeader.amount")}
      subtitle={t("aleo.bond.stepperHeader.stepRange", { currentStep: "2", totalSteps })}
    />
  );
}

function SelectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.bond.stepperHeader.selectDevice")} />;
}

function ConnectDeviceHeader() {
  const { t } = useTranslation();
  return <StepHeader title={t("aleo.bond.stepperHeader.connectDevice")} />;
}

function BondPublicFlow() {
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
        name={ScreenName.AleoBondPublicSelectValidator}
        component={SelectValidator}
        options={{
          headerTitle: SelectValidatorHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicAmount}
        component={Amount}
        options={{
          headerTitle: AmountHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: SelectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicConnectDevice}
        component={ConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: ConnectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
        listeners={{ beforeRemove: () => notifyFlowCompleted("stake") }}
      />
      <Stack.Screen
        name={ScreenName.AleoBondPublicValidationError}
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
export { BondPublicFlow as component, options };
