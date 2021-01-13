// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import {
  getStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import VoteStarted from "./Started";
import VoteSelectValidator, {
  SelectValidatorHeaderLeft,
} from "./01-SelectValidator";
import VoteCast from "./02-VoteCast";
import VoteSelectDevice from "../../../screens/SelectDevice";
import VoteConnectDevice from "../../../screens/ConnectDevice";
import VoteValidationError from "./04-ValidationError";
import VoteValidationSuccess from "./04-ValidationSuccess";

const totalSteps = "4";

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
        name={ScreenName.VoteStarted}
        component={VoteStarted}
        options={{
          title: t("tron.voting.flow.started.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteSelectValidator}
        component={VoteSelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("vote.stepperHeader.selectValidator")}
              subtitle={t("vote.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: () => <SelectValidatorHeaderLeft />,
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
        name={ScreenName.VoteCast}
        component={VoteCast}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("vote.stepperHeader.castVote")}
              subtitle={t("vote.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteSelectDevice}
        component={VoteSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("vote.stepperHeader.selectDevice")}
              subtitle={t("vote.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteConnectDevice}
        component={VoteConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("vote.stepperHeader.connectDevice")}
              subtitle={t("vote.stepperHeader.stepRange", {
                currentStep: "4",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteValidationError}
        component={VoteValidationError}
        options={{ headerTitle: null }}
      />
      <Stack.Screen
        name={ScreenName.VoteValidationSuccess}
        component={VoteValidationSuccess}
        options={{
          headerTitle: null,
          gestureEnabled: false,
          headerLeft: null,
          headerRight: null,
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
