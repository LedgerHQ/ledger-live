import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import RedelegationSelectValidator from "./SelectValidator";
import RedelegationAmount from "./Amount";
import RedelegationValidationError from "./ValidationError";
import RedelegationValidationSuccess from "./ValidationSuccess";
import type { HederaRedelegationFlowParamList } from "./types";

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
        name={ScreenName.HederaRedelegationSelectValidator}
        component={RedelegationSelectValidator}
        options={() => ({
          headerTitle: () => (
            <StepHeader
              title={t("hedera.redelegation.stepperHeader.selectValidatorTitle")}
              subtitle={t("hedera.redelegation.stepperHeader.selectValidatorSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.HederaRedelegationAmount}
        component={RedelegationAmount}
        options={() => ({
          headerTitle: () => (
            <StepHeader
              title={t("hedera.redelegation.stepperHeader.amountTitle")}
              subtitle={t("hedera.redelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.HederaRedelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.redelegation.stepperHeader.selectDevice")}
              subtitle={t("hedera.redelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaRedelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("hedera.redelegation.stepperHeader.connectDevice")}
              subtitle={t("hedera.redelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaRedelegationValidationError}
        component={RedelegationValidationError}
        options={{
          headerTitle: "",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaRedelegationValidationSuccess}
        component={RedelegationValidationSuccess}
        options={{
          headerLeft: undefined,
          headerTitle: "",
          headerRight: undefined,
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

const Stack = createStackNavigator<HederaRedelegationFlowParamList>();
