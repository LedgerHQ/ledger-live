import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import {
  bridgeSuspenseScreenLayout,
  defaultNavigationOptions,
  getStackNavigatorConfig,
} from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import ClaimRewardsSelectValidator from "./01-SelectValidator";
import ClaimRewardsClaim from "./02-Claim";
import ClaimRewardsSelectDevice from "~/screens/SelectDevice";
import ClaimRewardsConnectDevice from "~/screens/ConnectDevice";
import ClaimRewardsValidationError from "./04-ValidationError";
import ClaimRewardsValidationSuccess from "./04-ValidationSuccess";
import type { EvmClaimRewardsFlowParamList } from "./types";
import { Flex } from "@ledgerhq/native-ui";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

const totalSteps = "4";

function StepTitle({ titleKey, currentStep }: { titleKey: string; currentStep: string }) {
  const { t } = useTranslation();
  return (
    <StepHeader
      title={t(titleKey)}
      subtitle={t("evm.claimRewards.stepperHeader.stepRange", { currentStep, totalSteps })}
    />
  );
}

function ValidatorHeader() {
  const { t } = useTranslation();
  return (
    <Flex flex={1} width="90%" alignSelf="center">
      <StepHeader
        title={t("evm.claimRewards.stepperHeader.validator")}
        subtitle={t("evm.claimRewards.stepperHeader.stepRange", { currentStep: "1", totalSteps })}
        adjustFontSize
      />
    </Flex>
  );
}

function ClaimHeader() {
  return <StepTitle titleKey="evm.claimRewards.stepperHeader.claim" currentStep="2" />;
}

function SelectDeviceHeader() {
  return <StepTitle titleKey="evm.claimRewards.stepperHeader.selectDevice" currentStep="3" />;
}

function ConnectDeviceHeader() {
  return <StepTitle titleKey="evm.claimRewards.stepperHeader.connectDevice" currentStep="4" />;
}

function ClaimRewardsFlow() {
  const { colors } = useTheme();
  const { notifyFlowCompleted } = useNotificationsContext();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.EvmClaimRewardsValidator}
        component={ClaimRewardsSelectValidator}
        options={{
          headerTitle: ValidatorHeader,
          headerLeft: () => null,
          headerStyle: defaultNavigationOptions.headerStyle,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmClaimRewardsClaim}
        component={ClaimRewardsClaim}
        options={{ headerTitle: ClaimHeader }}
      />
      <Stack.Screen
        name={ScreenName.EvmClaimRewardsSelectDevice}
        component={ClaimRewardsSelectDevice}
        options={{ headerTitle: SelectDeviceHeader }}
      />
      <Stack.Screen
        name={ScreenName.EvmClaimRewardsConnectDevice}
        component={ClaimRewardsConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: ConnectDeviceHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmClaimRewardsValidationError}
        component={ClaimRewardsValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EvmClaimRewardsValidationSuccess}
        component={ClaimRewardsValidationSuccess}
        options={{
          headerLeft: undefined,
          headerRight: undefined,
          headerTitle: "",
          gestureEnabled: false,
        }}
        listeners={{
          beforeRemove: () => {
            notifyFlowCompleted("stake");
          },
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { ClaimRewardsFlow as component, options };
const Stack = createNativeStackNavigator<EvmClaimRewardsFlowParamList>();
