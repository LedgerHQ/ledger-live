import { NearValidatorItem } from "@ledgerhq/live-common/families/near/types";
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
import StakingAmount from "../shared/02-SelectAmount";
import StakingStarted from "./01-Started";
import SelectValidator from "./SelectValidator";
import StakingSummary from "./02-Summary";
import StakingValidationError from "./04-ValidationError";
import StakingValidationSuccess from "./04-ValidationSuccess";
import { NearStakingFlowParamList } from "./types";

const totalSteps = "3";

function StakingFlow() {
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
        name={ScreenName.NearStakingStarted}
        component={StakingStarted}
        options={{
          headerTitle: () => <StepHeader title={t("delegation.started.title")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.NearStakingValidator}
        component={StakingSummary}
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
        name={ScreenName.NearStakingValidatorSelect}
        component={SelectValidator}
        options={{
          gestureEnabled: false,
          headerTitle: () => <StepHeader title={t("delegation.selectValidatorTitle")} />,
        }}
      />
      <Stack.Screen
        name={ScreenName.NearStakingAmount}
        component={StakingAmount}
        options={({ route }: { route: { params: { validator: NearValidatorItem } } }) => ({
          headerRight: undefined,
          headerTitle: () => (
            <StepHeader
              title={route.params.validator.validatorAddress}
              subtitle={t("near.staking.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.NearStakingSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("near.staking.stepperHeader.selectDevice")}
              subtitle={t("near.staking.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.NearStakingConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("near.staking.stepperHeader.connectDevice")}
              subtitle={t("near.staking.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.NearStakingValidationError}
        component={StakingValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.NearStakingValidationSuccess}
        component={StakingValidationSuccess}
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

export { StakingFlow as component, options };

const Stack = createStackNavigator<NearStakingFlowParamList>();
