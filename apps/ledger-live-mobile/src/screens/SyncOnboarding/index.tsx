import React, { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { OnboardingState } from "@ledgerhq/live-common/lib/hw/extractOnboardingState";
import { OnboardingStep } from "@ledgerhq/live-common/lib/hw/extractOnboardingState";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/lib/onboarding/hooks/useOnboardingStatePolling";
import styled, { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Alert from "../../components/Alert";

const pollingPeriodMs = 1000;

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingWelcome"
>;

const AlertView = styled.View`
  padding: 20px 10px 0 10px;
`;

export const SyncOnboarding = ({ navigation, route }: Props): ReactElement => {
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const { onboardingState, allowedError, fatalError } = useOnboardingStatePolling({ device, pollingPeriodMs });

  const { pairedDevice } = route.params; 

  // When reaching the synchronized onboarding, the device could already
  // be BLE paired to the phone and at the same time not known by LLM,
  // it does not matter.
  // So as long as the device is not onboarded, the LLM will ask for a pairing.
  useEffect(() => {
    console.log("SyncOnboarding: navigate to pairDevices");

    // @ts-expect-error navigation issue
    navigation.navigate(ScreenName.PairDevices, {
      onlySelectDeviceWithoutFullAppPairing: true,
      onDoneNavigateTo: ScreenName.SyncOnboardingWelcome,
    });
  }, [navigation]);

  const handleOnPaired = useCallback((pairedDevice: Device) => {
    console.log(
      `SyncOnboarding: handleOnPaired ${JSON.stringify(pairedDevice)}`,
    );

    setDevice(pairedDevice);
  }, []);

  // Triggered when a new paired device is passed when navigating to this screen
  // It avoids having a callback function passed to the PairDevices screen
  useEffect(() => {
    if (pairedDevice) {
      handleOnPaired(pairedDevice);
    }
  }, [pairedDevice, handleOnPaired]);

  // WIP: only for demo
  const onboardingSteps = [
    "Pairing device",
    "Welcome Page",
    "Setup choice",
    "Setting up pin",
    `Writing seed words ${
      onboardingState && onboardingState.currentOnboardingStep === OnboardingStep.newDevice
        ? onboardingState.currentSeedWordIndex + 1
        : ""
    }`,
    `Confirming seed words ${
      onboardingState && onboardingState.currentOnboardingStep === OnboardingStep.newDeviceConfirming
        ? onboardingState.currentSeedWordIndex + 1
        : ""
    }`,
    "Safety Warning",
    "Ready ?"
  ];

  // Updates UI step index from the onboarding state
  useEffect(() => {
    if (!device) {
      // No device is paired yet
      setStepIndex(0);
      return;
    }

    // No change if the onboardingState is null
    if (!onboardingState) {
      return;
    }
    
    switch(onboardingState?.currentOnboardingStep) {
      case OnboardingStep.welcomeScreen:
        setStepIndex(1);
        break;
      case OnboardingStep.setupChoice:
        setStepIndex(2);
        break;
      case OnboardingStep.pin:
        setStepIndex(3);
        break;
      case OnboardingStep.newDevice:
        setStepIndex(4);
        break;
      case OnboardingStep.newDeviceConfirming:
        setStepIndex(5);
        break;
      case OnboardingStep.safetyWarning:
        setStepIndex(6);
        break;
      case OnboardingStep.ready:
        setStepIndex(7);
        break;
      default:
        setStepIndex(0);
    }
  }, [onboardingState, device]); 

  return (
    <>
    {allowedError ? (
      <AlertView>
        <Alert title="Allowed error during onboarding" type="warning">
          {allowedError.message}
        </Alert>
      </AlertView>
    ) : null}
    {fatalError ? (
      <AlertView>
        <Alert title="Fatal error during onboarding" type="error">
          {fatalError.message}
        </Alert>
      </AlertView>
    ) : null}
    <Flex
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height="100%"
      flex={1}
      bg={colors.background}
    >
      {onboardingSteps.map((label, i) => (
        <Text key={i} variant="h2" textAlign="left" color={colors.primary}>
          {label} {stepIndex === i ? "✏️" : stepIndex > i ? "✅" : "🦧"}
        </Text>
      ))}
    </Flex>
    </>
  );
};
