import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig, bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import UnstakeAmount from "./01-Amount";
import UnstakeSelectDevice from "~/screens/SelectDevice";
import UnstakeConnectDevice from "~/screens/ConnectDevice";
import UnstakeValidationSuccess from "./02-ValidationSuccess";
import UnstakeValidationError from "./02-ValidationError";
import type { TezosUnstakeFlowParamList } from "./types";

const totalSteps = "3";

function StepTitle({ titleKey, currentStep }: { titleKey: string; currentStep: string }) {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t(titleKey)}
      subtitle={t("send.stepperHeader.stepRange", { currentStep, totalSteps })}
    />
  );
}

function AmountHeader() {
  return <StepTitle titleKey="send.stepperHeader.selectAmount" currentStep="1" />;
}

function SelectDeviceHeader() {
  return <StepTitle titleKey="send.stepperHeader.selectDevice" currentStep="2" />;
}

function ConnectDeviceHeader() {
  return <StepTitle titleKey="send.stepperHeader.connectDevice" currentStep="3" />;
}

function UnstakeFlow() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.TezosUnstakeAmount}
        component={UnstakeAmount}
        options={{
          headerLeft: undefined,
          headerTitle: AmountHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosUnstakeSelectDevice}
        component={UnstakeSelectDevice}
        options={{
          headerTitle: SelectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosUnstakeConnectDevice}
        component={UnstakeConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: ConnectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosUnstakeValidationSuccess}
        component={UnstakeValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosUnstakeValidationError}
        component={UnstakeValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { UnstakeFlow as component, options };
const Stack = createNativeStackNavigator<TezosUnstakeFlowParamList>();
