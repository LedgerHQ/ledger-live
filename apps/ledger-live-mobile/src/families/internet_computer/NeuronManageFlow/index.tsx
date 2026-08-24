import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import SelectDevice from "~/screens/SelectDevice";
import AddHotKey from "./AddHotKey";
import ConnectDevice from "./ConnectDevice";
import Followees from "./Followees";
import FollowTopic from "./FollowTopic";
import IncreaseStake from "./IncreaseStake";
import NeuronDetails from "./NeuronDetails";
import NeuronList from "./NeuronList";
import RefreshVotingPower from "./RefreshVotingPower";
import SetDissolveDelay from "./SetDissolveDelay";
import SplitNeuron from "./SplitNeuron";
import StakeMaturity from "./StakeMaturity";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

// Every action ends the same way — pick a device, sign, see the result — so the step counter only
// covers that tail. The action screens themselves are detours off the neuron, not a fixed sequence.
const totalSteps = "3";

function NeuronManageFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const step = (title: string, currentStep?: string) => ({
    headerTitle: () => (
      <StepHeader
        title={title}
        subtitle={
          currentStep ? t("send.stepperHeader.stepRange", { currentStep, totalSteps }) : undefined
        }
      />
    ),
  });

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
        options={step(t("internetComputer.manageNeuronFlow.listNeuron.title"))}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronDetails}
        component={NeuronDetails}
        options={step(t("internetComputer.manageNeuronFlow.manage.title"))}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronRefreshVotingPower}
        component={RefreshVotingPower}
        options={step(t("internetComputer.refreshVotingPowerFlow.title"))}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronIncreaseStake}
        component={IncreaseStake}
        options={step(t("internetComputer.manageNeuronFlow.increaseStake.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronSetDissolveDelay}
        component={SetDissolveDelay}
        options={step(t("internetComputer.manageNeuronFlow.setDissolveDelay.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronStakeMaturity}
        component={StakeMaturity}
        options={step(t("internetComputer.manageNeuronFlow.stakeMaturity.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronSplit}
        component={SplitNeuron}
        options={step(t("internetComputer.manageNeuronFlow.splitNeuron.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronAddHotKey}
        component={AddHotKey}
        options={step(t("internetComputer.manageNeuronFlow.addHotKey.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronFollowTopic}
        component={FollowTopic}
        options={step(t("internetComputer.manageNeuronFlow.followTopic.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronFollowees}
        component={Followees}
        options={step(t("internetComputer.manageNeuronFlow.selectFollowees.title"), "1")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronSelectDevice}
        component={SelectDevice}
        options={step(t("send.stepperHeader.selectDevice"), "2")}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronConnectDevice}
        component={ConnectDevice}
        options={{
          ...step(t("send.stepperHeader.connectDevice"), "3"),
          headerLeft: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name={ScreenName.InternetComputerNeuronValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };

export { NeuronManageFlow as component, options };

const Stack = createNativeStackNavigator<InternetComputerNeuronManageFlowParamList>();
