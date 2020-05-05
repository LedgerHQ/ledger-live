// @flow
import React from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import {
  closableStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import VoteStarted from "./Started";
import VoteSelectValidator, {
  SelectValidatorHeaderLeft,
} from "./01-SelectValidator";
import VoteCast from "./02-VoteCast";
import VoteConnectDevice from "./03-ConnectDevice";
import VoteValidation from "./04-Validation";
import VoteValidationError from "./04-ValidationError";
import VoteValidationSuccess from "./04-ValidationSuccess";

function VoteFlow() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...closableStackNavigatorConfig,
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
                totalSteps: "4",
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
                totalSteps: "4",
              })}
            />
          ),
          headerLeft: null,
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
                currentStep: "3",
                totalSteps: "4",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteValidation}
        component={VoteValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("vote.stepperHeader.verification")}
              subtitle={t("vote.stepperHeader.stepRange", {
                currentStep: "4",
                totalSteps: "4",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteValidationError}
        component={VoteValidationError}
        options={{
          headerTitle: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.VoteValidationSuccess}
        component={VoteValidationSuccess}
        options={{
          headerTitle: null,
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
