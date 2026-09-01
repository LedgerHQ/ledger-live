import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";

import VoteDelegationStarted from "./01-Started";
import VoteDelegationSummary from "./02-Summary";
import SelectDRep from "./SelectDRep";
import VoteDelegationValidationError from "./04-ValidationError";
import VoteDelegationValidationSuccess from "./04-ValidationSuccess";
import { CardanoVoteDelegationFlowParamList } from "./types";

const totalSteps = "3";

const Stack = createNativeStackNavigator<CardanoVoteDelegationFlowParamList>();

function VoteDelegationFlow() {
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
        name={ScreenName.CardanoVoteDelegationStarted}
        component={VoteDelegationStarted}
        options={{
          headerTitle: () => <StepHeader title={t("cardano.voteDelegation.header")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.CardanoVoteDelegationSummary}
        component={VoteDelegationSummary}
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
        name={ScreenName.CardanoVoteDelegationSelectDRep}
        component={SelectDRep}
        options={{
          headerTitle: () => <StepHeader title={t("cardano.voteDelegation.flow.steps.dRep.title")} />,
        }}
      />

      <Stack.Screen
        name={ScreenName.CardanoVoteDelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cardano.delegation.stepperHeader.selectDevice")}
              subtitle={t("cardano.delegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.CardanoVoteDelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("cardano.delegation.stepperHeader.connectDevice")}
              subtitle={t("cardano.delegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CardanoVoteDelegationValidationError}
        component={VoteDelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CardanoVoteDelegationValidationSuccess}
        component={VoteDelegationValidationSuccess}
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

export { VoteDelegationFlow as component, options };
