import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import {
  bridgeSuspenseScreenLayout,
  defaultNavigationOptions,
  getStackNavigatorConfig,
} from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import Withdraw from "./01-Withdraw";
import WithdrawSelectDevice from "~/screens/SelectDevice";
import WithdrawConnectDevice from "~/screens/ConnectDevice";
import WithdrawValidationError from "./03-ValidationError";
import WithdrawValidationSuccess from "./03-ValidationSuccess";
import type { EvmWithdrawFlowParamList } from "./types";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

const totalSteps = "3";

function StepTitle({ titleKey, currentStep }: { titleKey: string; currentStep: string }) {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t(titleKey)}
      subtitle={t("evm.withdraw.stepperHeader.stepRange", { currentStep, totalSteps })}
    />
  );
}

function WithdrawHeader() {
  return <StepTitle titleKey="evm.withdraw.stepperHeader.title" currentStep="1" />;
}

function SelectDeviceHeader() {
  return <StepTitle titleKey="evm.withdraw.stepperHeader.selectDevice" currentStep="2" />;
}

function ConnectDeviceHeader() {
  return <StepTitle titleKey="evm.withdraw.stepperHeader.connectDevice" currentStep="3" />;
}

function WithdrawFlow() {
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsContext();
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
        name={ScreenName.EvmWithdrawConfirmation}
        component={Withdraw}
        options={{
          headerTitle: WithdrawHeader,
          headerLeft: () => null,
          headerStyle: defaultNavigationOptions.headerStyle,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmWithdrawSelectDevice}
        component={WithdrawSelectDevice}
        options={{ headerTitle: SelectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.EvmWithdrawConnectDevice}
        component={WithdrawConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: ConnectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmWithdrawValidationError}
        component={WithdrawValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmWithdrawValidationSuccess}
        component={WithdrawValidationSuccess}
        options={{
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: "",
          gestureEnabled: false,
        }}
        listeners={{
          beforeRemove: () => {
            notifyFlowCompleted("stake");
          },
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { WithdrawFlow as component, options };
const Stack = createNativeStackNavigator<EvmWithdrawFlowParamList>();
