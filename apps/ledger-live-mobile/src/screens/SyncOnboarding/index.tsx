import React, { useEffect, useState } from "react";
import { useTheme } from "styled-components/native";
import type { StackScreenProps } from "@react-navigation/stack";
import { Button, Flex, StepList, Text } from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/src/onboarding/hooks/useOnboardingStatePolling";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { OnboardingStep } from "@ledgerhq/live-common/src/hw/extractOnboardingState";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";

const pollingPeriodMs = 1000;

const defaultOnboardingSteps = [
  {
    status: "inactive",
    deviceStates: [OnboardingStep.WelcomeScreen, OnboardingStep.SetupChoice],
    title: "Nano paired",
  },
  {
    status: "inactive",
    deviceStates: [OnboardingStep.Pin],
    title: "Set your PIN",
    renderBody: () => (
      <Text>
        {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
      </Text>
    ),
  },
  {
    status: "inactive",
    deviceStates: [
      OnboardingStep.NewDevice,
      OnboardingStep.NewDeviceConfirming,
      OnboardingStep.RestoreSeed,
      OnboardingStep.SafetyWarning,
    ],
    title: "Recovery phrase",
    renderBody: () => (
      <Text>
        {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
      </Text>
    ),
  },
  {
    status: "inactive",
    deviceStates: [],
    title: "Software check",
    renderBody: () => (
      <Text>{`We'll verify whether your Nano is genuine. This should be quick and easy!`}</Text>
    ),
  },
  {
    status: "inactive",
    deviceStates: [OnboardingStep.Ready],
    title: "Nano is ready",
  },
];

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const [onboardingSteps, setOnboardingSteps] = useState(
    defaultOnboardingSteps,
  );

  const { device } = route.params;

  const { onboardingState, allowedError, fatalError } =
    useOnboardingStatePolling({ device, pollingPeriodMs });

  console.log("Allowed Error:", allowedError);

  console.log("Fatal Error:", fatalError);

  useEffect(() => {
    console.log(onboardingState);
    setOnboardingSteps(
      defaultOnboardingSteps.map(step => {
        if (
          onboardingState &&
          onboardingState.currentOnboardingStep &&
          step.deviceStates.includes(onboardingState.currentOnboardingStep)
        ) {
          return {
            ...step,
            status: "active",
          };
        }
        return step;
      }),
    );
  }, [onboardingState]);

  return (
    <Flex px={7} py={8}>
      <Flex flexDirection="row" justifyContent="space-between" mt={6} mb={8}>
        <Button type="main" outline>
          EN
        </Button>
        <Button Icon={CloseMedium} />
      </Flex>
      <Text variant="h4">Setup Manual</Text>
      <Text mb={8} variant="body">
        Continue setting up on your Nano. Check back here for tips and
        information.
      </Text>
      <StepList items={onboardingSteps} />
    </Flex>
  );
};
