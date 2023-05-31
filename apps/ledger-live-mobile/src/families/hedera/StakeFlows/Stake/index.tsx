import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { getStackNavigatorConfig } from "../../../../navigation/navigatorConfig";
import { ScreenName } from "../../../../const";

import StepHeader from "../../../../components/StepHeader";
import StepStakingType from "./02-StepStakingType";
import StepSummary from "./03-StepSummary";
import ConnectDevice from "../../../../screens/ConnectDevice";
import SelectDevice from "../../../../screens/SelectDevice";
import ValidationError from "./04-ValidationError";
import ValidationSuccess from "./04-ValidationSuccess";
import { HederaStakeFlowParamList } from "../types";
import StepStakingStarted from "./01-StepStakingStarted";

const totalSteps = "3";

function StakeFlow() {
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
        name={ScreenName.HederaStakingStarted}
        component={StepStakingStarted}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.stake.stepperHeader.stake")}
              subtitle={t("hedera.stake.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          // headerLeft: () => null,
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={ScreenName.HederaStakingType}
        component={StepStakingType}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.stake.stepperHeader.stake")}
              subtitle={t("hedera.stake.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
          // headerLeft: () => null,
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />

      {/* Summary */}
      <Stack.Screen
        name={ScreenName.HederaStakeSummary}
        component={StepSummary}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.stake.stepperHeader.summary")}
              subtitle={t("hedera.stake.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />

      {/* Device Selection */}
      <Stack.Screen
        name={ScreenName.HederaStakeSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("hedera.stake.stepperHeader.selectDevice")}
              subtitle={t("hedera.stake.stepperHeader.stepRange", {
                currentStep: "4",
                totalSteps,
              })}
            />
          ),
        }}
      />

      {/* Device Connect */}
      <Stack.Screen
        name={ScreenName.HederaStakeConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("hedera.stake.stepperHeader.connectDevice")}
              subtitle={t("hedera.stake.stepperHeader.stepRange", {
                currentStep: "5",
                totalSteps,
              })}
            />
          ),
        }}
      />

      {/* Error */}
      <Stack.Screen
        name={ScreenName.HederaStakeValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      {/* Success */}
      <Stack.Screen
        name={ScreenName.HederaStakeValidationSuccess}
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

export { StakeFlow as component, options };

const Stack = createStackNavigator<HederaStakeFlowParamList>();
