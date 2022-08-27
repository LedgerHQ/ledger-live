import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import VoteConnectDevice from "../../../screens/ConnectDevice";
import VoteSelectDevice from "../../../screens/SelectDevice";
import SelectHIP from "./SelectHIP";
import VoteStarted from "./Started";
import VoteSummary from "./Summary";
import VoteValidationError from "./ValidationError";
import VoteValidationSuccess from "./ValidationSuccess";

const totalSteps = "3";

function VoteFlow() {
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
        name={ScreenName.HeliumVoteStarted}
        component={VoteStarted}
        options={{
          headerTitle: () => (
            <StepHeader title={t("helium.vote.startedTitle")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HeliumVoteSummary}
        component={VoteSummary}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("helium.vote.flow.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HeliumSelectHIP}
        component={SelectHIP}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader title={t("helium.vote.flow.steps.selectHIP.title")} />
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.HeliumVoteConnectDevice}
        component={VoteConnectDevice}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("send.stepperHeader.connectDevice")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.HeliumVoteSelectDevice}
        component={VoteSelectDevice}
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
        name={ScreenName.HeliumVoteValidationSuccess}
        component={VoteValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.HeliumVoteValidationError}
        component={VoteValidationError}
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

export { VoteFlow as component, options };

const Stack = createStackNavigator();
