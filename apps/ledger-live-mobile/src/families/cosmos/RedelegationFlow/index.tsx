import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig, defaultNavigationOptions } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import RedelegationSelectValidator from "./01-SelectValidator";
import RedelegationAmount from "../shared/02-SelectAmount";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import RedelegationValidationError from "./04-ValidationError";
import RedelegationValidationSuccess from "./04-ValidationSuccess";
import type { CosmosRedelegationFlowParamList } from "./types";

const totalSteps = "3";

function RedelegationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidator}
        component={RedelegationSelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.validator")}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: () => null,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosDefaultRedelegationAmount}
        component={RedelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.amountTitle", {
                from: route.params?.validatorSrc?.name ?? "",
                to: route.params?.validator?.name ?? "",
              })}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: () => null,
        })}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationAmount}
        component={RedelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.amountTitle", {
                from: route.params?.validatorSrc?.name ?? "",
                to: route.params?.validator?.name ?? "",
              })}
              subtitle={t("cosmos.redelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.selectDevice")}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.connectDevice")}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidationError}
        component={RedelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidationSuccess}
        component={RedelegationValidationSuccess}
        options={{
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { RedelegationFlow as component, options };
const Stack = createStackNavigator<CosmosRedelegationFlowParamList>();
