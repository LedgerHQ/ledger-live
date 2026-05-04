import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Platform, Pressable, View } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import { useTranslation } from "~/context/Locale";
import type { EvmDelegationFlowParamList } from "./types";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

const Stack = createNativeStackNavigator<EvmDelegationFlowParamList>();

const totalSteps = "2";

function ValidationError({
  navigation,
}: StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationValidationError>) {
  return <Pressable testID="SendErrorClose" onPress={() => navigation.getParent()?.goBack()} />;
}

function ValidationSuccess({
  navigation,
}: StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationValidationSuccess>) {
  return (
    <View testID="validate-success-screen">
      <Pressable
        testID="enabled-success-close-button"
        onPress={() => navigation.getParent()?.goBack()}
      />
    </View>
  );
}

function DelegationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsContext();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.EvmDelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("evm.delegation.stepperHeader.selectDevice")}
              subtitle={t("evm.delegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("evm.delegation.stepperHeader.connectDevice")}
              subtitle={t("evm.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationValidationSuccess}
        component={ValidationSuccess}
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

export { DelegationFlow as component, options };
