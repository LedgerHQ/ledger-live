import React, { useEffect, useState, useCallback } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import {
  Button,
  Flex,
  ScrollContainer,
  ScrollContainerHeader,
  VerticalTimeline,
  Text,
} from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/src/onboarding/hooks/useOnboardingStatePolling";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { OnboardingStep } from "@ledgerhq/live-common/src/hw/extractOnboardingState";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Question from "../../icons/Question";
import HelpDrawer from "./HelpDrawer";
import DesyncDrawer from "./DesyncDrawer";
import ResyncOverlay from "./ResyncOverlay";

type Step = {
  status: "completed" | "active" | "inactive";
  deviceStates: OnboardingStep[];
  title: string;
  renderBody?: () => ReactNode;
};

const defaultOnboardingSteps: Step[] = [
  {
    status: "inactive",
    deviceStates: [],
    title: "Nano paired",
  },
  {
    status: "inactive",
    deviceStates: [
      OnboardingStep.WelcomeScreen,
      OnboardingStep.SetupChoice,
      OnboardingStep.Pin,
    ],
    title: "Set your PIN",
    renderBody: () => (
      <Flex>
        <Text
          variant="bodyLineHeight"
          mb={6}
        >{`Your PIN can be 4 to 8 digits long.`}</Text>
        <Text variant="bodyLineHeight">
          {`Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
        </Text>
      </Flex>
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
      <Text variant="bodyLineHeight">
        {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
      </Text>
    ),
  },
  {
    status: "inactive",
    deviceStates: [],
    title: "Software check",
    renderBody: () => (
      <Text variant="bodyLineHeight">{`We'll verify whether your Naimport { SafeAreaView } from 'react-native-safe-area-context';no is genuine. This should be quick and easy!`}</Text>
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

const pollingPeriodMs = 1000;
const pollingTimeoutMs = 5000;

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isDesyncDrawerOpen, setDesyncDrawerOpen] = useState<boolean>(false);
  const [onboardingSteps, setOnboardingSteps] = useState(
    defaultOnboardingSteps,
  );

  const { device } = route.params;

  const { onboardingState, allowedError, fatalError } =
    useOnboardingStatePolling({ device, pollingPeriodMs, stopPolling });

  useEffect(() => {
    const newStepState: Step[] = [];

    const needToUpdateSteps = defaultOnboardingSteps.some(
      (step, index, steps) => {
        if (
          onboardingState &&
          onboardingState.currentOnboardingStep &&
          step.deviceStates.includes(onboardingState.currentOnboardingStep)
        ) {
          newStepState.push({
            ...step,
            status: "active",
          });
          newStepState.push(...steps.slice(index + 1));
          return true;
        }

        newStepState.push({
          ...step,
          status: "completed",
        });
        return false;
      },
    );

    if (needToUpdateSteps) {
      setOnboardingSteps(newStepState);
    }
  }, [onboardingState]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleTimerRunsOut = useCallback(() => {
    setDesyncDrawerOpen(true);
  }, [setDesyncDrawerOpen]);

  // useEffect(() => {
  //   console.log("Fatal error");
  //   setDesyncDrawerOpen(true);
  // }, [fatalError]);

  useEffect(() => {
    if (allowedError && !timer) {
      setTimer(setTimeout(handleTimerRunsOut, pollingTimeoutMs));
    } else if (!allowedError && timer) {
      clearTimeout(timer);
      setTimer(null);
    }
  }, [allowedError, handleTimerRunsOut, timer]);

  useEffect(() => {
    if (isDesyncDrawerOpen) {
      console.log("hello");
      setStopPolling(false);
    }
  }, [isDesyncDrawerOpen]);

  return (
    <SafeAreaView>
      <Flex height="100%" position="relative">
        <HelpDrawer
          isOpen={isHelpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
        />
        <DesyncDrawer
          isOpen={isDesyncDrawerOpen}
          onClose={() => setDesyncDrawerOpen(false)}
        />
        <ResyncOverlay isOpen={!!timer && !stopPolling} />
        <ScrollContainer>
          <ScrollContainerHeader>
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              pt={7}
              px={7}
            >
              <Button type="main" outline>
                EN
              </Button>
              <Button type="default" Icon={CloseMedium} onPress={handleClose} />
            </Flex>
          </ScrollContainerHeader>
          <Flex px={7} pt={7}>
            <Flex flexDirection="row" alignItems="center">
              <Text variant="h4" fontWeight="semiBold">
                Setup Manual
              </Text>
              <Button
                ml={2}
                Icon={Question}
                onPress={() => setHelpDrawerOpen(true)}
              />
            </Flex>
            <Text variant="body" color="neutral.c80">
              Continue setting up on your Nano.
            </Text>
            <Text mb={8} variant="body" color="neutral.c80">
              Check back here for tips and information.
            </Text>
            <VerticalTimeline steps={onboardingSteps} />
          </Flex>
        </ScrollContainer>
      </Flex>
    </SafeAreaView>
  );
};
