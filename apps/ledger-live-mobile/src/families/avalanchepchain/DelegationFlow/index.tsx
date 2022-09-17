import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import ConnectDevice from "../../../screens/ConnectDevice";
import SelectDevice from "../../../screens/SelectDevice";
import DelegationAmount from "./02-Amount";
import DelegationEndDate from "./02-EndDate";
import DelegationStarted from "./01-Started";
import SelectValidator from "../SelectValidator";
import DelegationSummary from "./02-Summary";
import DelegationValidationError from "./04-ValidationError";
import DelegationValidationSuccess from "./04-ValidationSuccess";

const totalSteps = "3";

function DelegationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AvalancheDelegationStarted}
        component={DelegationStarted}
        options={{
          headerTitle: () => (
            <StepHeader title={t("delegation.started.title")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AvalancheDelegationValidator}
        component={DelegationSummary}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("delegation.summaryTitle")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.AvalancheDelegationValidatorSelect}
        component={SelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader title={t("delegation.selectValidatorTitle")} />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.AvalancheDelegationAmount}
        component={DelegationAmount}
        options={{
          headerRight: undefined,
          headerTitle: () => (
            <StepHeader
              title={t("avalanchepchain.delegation.stepperHeader.amount")}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.AvalancheDelegationEndDate}
        component={DelegationEndDate}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("avalanchepchain.delegation.stepperHeader.endDate")}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.AvalancheDelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("avalanchepchain.delegation.stepperHeader.selectDevice")}
              subtitle={t(
                "avalanchepchain.delegation.stepperHeader.stepRange",
                {
                  currentStep: "2",
                  totalSteps,
                },
              )}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.AvalancheDelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t(
                "avalanchepchain.delegation.stepperHeader.connectDevice",
              )}
              subtitle={t(
                "avalanchepchain.delegation.stepperHeader.stepRange",
                {
                  currentStep: "3",
                  totalSteps,
                },
              )}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AvalancheDelegationValidationError}
        component={DelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AvalancheDelegationValidationSuccess}
        component={DelegationValidationSuccess}
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

export { DelegationFlow as component, options };

const Stack = createStackNavigator();
