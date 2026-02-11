import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { Platform } from "react-native";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import StakingValidator from "./01-Validator";
import StakingSummary from "./02-Summary";
import StakingValidationError from "./04-ValidationError";
import StakingValidationSuccess from "./04-ValidationSuccess";
import { MinaStakingFlowParamList } from "./types";

const totalSteps = "3";

const Stack = createNativeStackNavigator<MinaStakingFlowParamList>();

const ValidatorStepHeader = ({ title }: { title: string }) => <StepHeader title={title} />;

const SummaryStepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <StepHeader title={title} subtitle={subtitle} />
);

const SelectDeviceStepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <StepHeader title={title} subtitle={subtitle} />
);

const ConnectDeviceStepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <StepHeader title={title} subtitle={subtitle} />
);

function StakingFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const validatorHeaderTitle = useCallback(
    () => <ValidatorStepHeader title={t("mina.selectValidator.title")} />,
    [t],
  );

  const summaryHeaderTitle = useCallback(
    () => (
      <SummaryStepHeader
        title={t("delegation.summaryTitle")}
        subtitle={t("send.stepperHeader.stepRange", {
          currentStep: "1",
          totalSteps,
        })}
      />
    ),
    [t],
  );

  const selectDeviceHeaderTitle = useCallback(
    () => (
      <SelectDeviceStepHeader
        title={t("mina.selectValidator.stepLabels.connectDevice")}
        subtitle={t("send.stepperHeader.stepRange", {
          currentStep: "2",
          totalSteps,
        })}
      />
    ),
    [t],
  );

  const connectDeviceHeaderTitle = useCallback(
    () => (
      <ConnectDeviceStepHeader
        title={t("mina.selectValidator.stepLabels.connectDevice")}
        subtitle={t("send.stepperHeader.stepRange", {
          currentStep: "3",
          totalSteps,
        })}
      />
    ),
    [t],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.MinaStakingValidator}
        component={StakingValidator}
        options={{
          headerTitle: validatorHeaderTitle,
        }}
      />
      <Stack.Screen
        name={ScreenName.MinaStakingSummary}
        component={StakingSummary}
        options={{
          gestureEnabled: false,
          headerTitle: summaryHeaderTitle,
        }}
      />
      <Stack.Screen
        name={ScreenName.MinaStakingSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: selectDeviceHeaderTitle,
        }}
      />
      <Stack.Screen
        name={ScreenName.MinaStakingConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: connectDeviceHeaderTitle,
        }}
      />
      <Stack.Screen
        name={ScreenName.MinaStakingValidationError}
        component={StakingValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.MinaStakingValidationSuccess}
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
