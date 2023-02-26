import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import {
  defaultNavigationOptions, getStackNavigatorConfig
} from "../../../navigation/navigatorConfig";
import IconVoteConnectDevice from "../../../screens/ConnectDevice";
import IconVoteSelectDevice from "../../../screens/SelectDevice";
import IconVoteSelectValidator, {
  SelectValidatorHeaderLeft
} from "./01-SelectValidator";
import IconVoteCast from "./02-VoteCast";
import IconVoteValidationError from "./04-ValidationError";
import IconVoteValidationSuccess from "./04-ValidationSuccess";
import IconVoteStarted from "./Started";
import { IconVoteFlowParamList } from "./types";

const totalSteps = "4";

function IconVoteFlow() {
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
        name={ScreenName.IconVoteStarted}
        component={IconVoteStarted}
        options={{
          title: t("icon.voting.flow.started.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.IconVoteSelectValidator}
        component={IconVoteSelectValidator}
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
        name={ScreenName.IconVoteCast}
        component={IconVoteCast}
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
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.IconVoteSelectDevice}
        component={IconVoteSelectDevice}
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
        name={ScreenName.IconVoteConnectDevice}
        component={IconVoteConnectDevice}
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
        name={ScreenName.IconVoteValidationError}
        component={IconVoteValidationError}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.IconVoteValidationSuccess}
        component={IconVoteValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { IconVoteFlow as component, options };
const Stack = createStackNavigator<IconVoteFlowParamList>();
