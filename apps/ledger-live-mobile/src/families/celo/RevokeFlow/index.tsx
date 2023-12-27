import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import VoteAmount from "./VoteAmount";
import SelectValidator from "./SelectValidator";
import VoteSummary from "./01-Summary";
import DelegationValidationError from "./ValidationError";
import DelegationValidationSuccess from "./ValidationSuccess";
import type { CeloRevokeFlowFlowParamList } from "./types";

const totalSteps = "3";

function RevokeFlow() {
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
        name={ScreenName.CeloRevokeSummary}
        component={VoteSummary}
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
        name={ScreenName.CeloRevokeValidatorSelect}
        component={SelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.CeloRevokeAmount}
        component={VoteAmount}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("send.stepperHeader.selectAmount")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.CeloRevokeConnectDevice}
        component={ConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("celo.revoke.stepperHeader.connectDevice")}
              subtitle={t("celo.revoke.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRevokeSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("celo.revoke.stepperHeader.selectDevice")}
              subtitle={t("celo.revoke.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRevokeValidationSuccess}
        component={DelegationValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CeloRevokeValidationError}
        component={DelegationValidationError}
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

export { RevokeFlow as component, options };

const Stack = createStackNavigator<CeloRevokeFlowFlowParamList>();
