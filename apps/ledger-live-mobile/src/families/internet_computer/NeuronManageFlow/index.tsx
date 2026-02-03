import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "./ConnectDevice";
import NeuronList from "./NeuronList";
import NeuronAction from "./NeuronAction";
import SetDissolveDelay from "./SetDissolveDelay";
import AddHotKey from "./AddHotKey";
import RemoveHotKey from "./RemoveHotKey";
import StakeMaturity from "./StakeMaturity";
import FollowSelectTopic from "./FollowSelectTopic";
import FollowSelectFollowees from "./FollowSelectFollowees";
import ConfirmFollowingList from "./ConfirmFollowingList";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";
import { InternetComputerNeuronManageFlowParamList } from "./types";

const totalSteps = "3";

function NeuronManageFlow() {
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
        name={ScreenName.InternetComputerNeuronList}
        component={NeuronList}
        options={{
          headerTitle: () => <StepHeader title={t("icp.neuronManage.list.title")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronAction}
        component={NeuronAction}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.action.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronSetDissolveDelay}
        component={SetDissolveDelay}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.action.setDissolveDelay.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronAddHotKey}
        component={AddHotKey}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.action.addHotKey.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronRemoveHotKey}
        component={RemoveHotKey}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.action.removeHotKey.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronStakeMaturity}
        component={StakeMaturity}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.action.stakeMaturity.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronFollowSelectTopic}
        component={FollowSelectTopic}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.action.follow.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronFollowSelectFollowees}
        component={FollowSelectFollowees}
        options={{
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.followSelectFollowees.headerTitle")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronConfirmFollowingList}
        component={ConfirmFollowingList}
        options={{
          headerTitle: () => (
            <StepHeader title={t("icp.neuronManage.confirmFollowing.headerTitle")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.device.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("icp.neuronManage.connect.title")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronValidationSuccess}
        component={ValidationSuccess}
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

export { NeuronManageFlow as component, options };

const Stack = createNativeStackNavigator<InternetComputerNeuronManageFlowParamList>();
