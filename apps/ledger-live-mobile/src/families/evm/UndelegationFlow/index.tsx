import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import UndelegationAmount from "./01-Amount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import UndelegationValidationError from "./03-ValidationError";
import UndelegationValidationSuccess from "./03-ValidationSuccess";
import type { EvmUndelegationFlowParamList } from "./types";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

const totalSteps = "3";

function UndelegationFlow() {
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
        name={ScreenName.EvmUndelegationAmount}
        component={UndelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={route.params?.delegation?.validator?.name ?? ""}
              subtitle={t("evm.undelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.EvmUndelegationSelectDevice}
        component={SelectDevice}
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
        name={ScreenName.EvmUndelegationConnectDevice}
        component={ConnectDevice}
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
        name={ScreenName.EvmUndelegationValidationError}
        component={UndelegationValidationError}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmUndelegationValidationSuccess}
        component={UndelegationValidationSuccess}
        options={{
          headerLeft: undefined,
          headerTitle: "",
          headerRight: undefined,
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
export { UndelegationFlow as component, options };
const Stack = createNativeStackNavigator<EvmUndelegationFlowParamList>();
