import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig, bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import StakeAmount from "./01-Amount";
import StakeSelectDevice from "~/screens/SelectDevice";
import StakeConnectDevice from "~/screens/ConnectDevice";
import StakeValidationSuccess from "./02-ValidationSuccess";
import StakeValidationError from "./02-ValidationError";
import type { TezosStakeFlowParamList } from "./types";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

const totalSteps = "3";

function StakeFlow() {
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
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.TezosStakeAmount}
        component={StakeAmount}
        options={{
          headerLeft: undefined,
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.selectAmount")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosStakeSelectDevice}
        component={StakeSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.selectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosStakeConnectDevice}
        component={StakeConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.connectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosStakeValidationSuccess}
        component={StakeValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
        listeners={{
          beforeRemove: () => {
            notifyFlowCompleted("stake");
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.TezosStakeValidationError}
        component={StakeValidationError}
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
export { StakeFlow as component, options };
const Stack = createNativeStackNavigator<TezosStakeFlowParamList>();
