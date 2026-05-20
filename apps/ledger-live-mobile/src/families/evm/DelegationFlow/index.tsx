import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import { useTranslation } from "~/context/Locale";
import SelectValidator from "./01-SelectValidator";
import SelectAmount from "./02-SelectAmount";
import ValidationError from "./03-ValidationError";
import ValidationSuccess from "./03-ValidationSuccess";
import DelegationStarted from "./01-Started";
import SelectRedelegationValidator from "./04-SelectRedelegationValidator";
import RedelegationAmount from "./05-RedelegationAmount";
import RedelegationValidationError from "./06-RedelegationValidationError";
import RedelegationValidationSuccess from "./06-RedelegationValidationSuccess";
import type { EvmDelegationFlowParamList } from "./types";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

const totalSteps = "3";

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
        name={ScreenName.EvmDelegationStarted}
        component={DelegationStarted}
        options={{
          headerTitle: () => <StepHeader title={t("delegation.started.title")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationValidator}
        component={SelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("delegation.selectValidatorTitle")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationAmount}
        component={SelectAmount}
        options={({ route }) => ({
          headerRight: undefined,
          headerTitle: () => (
            <StepHeader
              title={
                route.params?.validator?.name ??
                route.params?.validator?.validatorAddress ??
                t("send.summary.amount")
              }
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.EvmDelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.selectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
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
      <Stack.Screen
        name={ScreenName.EvmRedelegationValidator}
        component={SelectRedelegationValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("evm.redelegation.stepperHeader.validator")}
              subtitle={t("evm.redelegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmRedelegationAmount}
        component={RedelegationAmount}
        options={({ route }) => ({
          headerRight: undefined,
          headerTitle: () => (
            <StepHeader
              title={t("evm.redelegation.stepperHeader.amountTitle", {
                from:
                  route.params?.validatorSrc?.name ??
                  route.params?.validatorSrc?.validatorAddress ??
                  "",
                to:
                  route.params?.validator?.name ??
                  route.params?.validator?.validatorAddress ??
                  t("send.summary.amount"),
              })}
              subtitle={t("evm.redelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.EvmRedelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("evm.redelegation.stepperHeader.selectDevice")}
              subtitle={t("evm.redelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmRedelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("evm.redelegation.stepperHeader.connectDevice")}
              subtitle={t("evm.redelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmRedelegationValidationError}
        component={RedelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmRedelegationValidationSuccess}
        component={RedelegationValidationSuccess}
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

const Stack = createNativeStackNavigator<EvmDelegationFlowParamList>();
