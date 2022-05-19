import React, { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import type { OnboardingState } from "@ledgerhq/live-common/lib/hw/extractOnboardingState";
import {
  extractOnboardingState,
} from "@ledgerhq/live-common/lib/hw/extractOnboardingState";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { from, of, Subscription, throwError, timer } from "rxjs";
import {
  mergeMap,
  concatMap,
  delayWhen,
  map,
  tap,
  retryWhen,
} from "rxjs/operators";
import getVersion from "@ledgerhq/live-common/lib/hw/getVersion";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { TransportStatusError } from "@ledgerhq/errors";
import type { FirmwareInfo } from "@ledgerhq/live-common/lib/types/manager";
import { ScreenName } from "../../const";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";

// FIXME: Define an initial onboarding state - or cannot have an initial state in our use case ?
const initialOnboardingState: OnboardingState = {
  isOnboarded: false,
  isInRecoveryMode: false,
  isRecoveringSeed: false,
  isConfirmingSeedWords: false,
  seedPhraseType: "24-words",
  currentSeedWordIndex: 0,
};

const pollingFrequencyMs = 1000;

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingWelcome"
>;

export const SyncOnboarding = ({ navigation, route }: Props): ReactElement => {
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    initialOnboardingState,
  );
  const [stepIndex, setStepIndex] = useState<number>(0);

  const { pairedDevice } = route.params;

  // WIP: only for demo
  const onboardingSteps = [
    "Pairing device",
    "Setting up pin",
    `Writing seed words ${
      !onboardingState.isConfirmingSeedWords &&
      onboardingState.currentSeedWordIndex > 0
        ? onboardingState.currentSeedWordIndex + 1
        : ""
    }`,
    `Confirming seed words ${
      onboardingState.isConfirmingSeedWords
        ? onboardingState.currentSeedWordIndex + 1
        : ""
    }`,
  ];

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

  // Polls device state to update the onboarding state
  useEffect(() => {
    let onboardingStatePollingSubscription: Subscription;

    if (device) {
      console.log(
        `SyncOnboarding: 🧑‍💻 new device: ${JSON.stringify(device)}`,
      );

      onboardingStatePollingSubscription = timer(0, pollingFrequencyMs)
        .pipe(
          tap(i => {
            console.log(`SyncOnboarding: ▶️ Polling ${i}`);
          }),
          concatMap(() =>
            withDevice(device.deviceId)(t => from(getVersion(t))),
          ),
          retryWhen(errors =>
            errors.pipe(
              mergeMap(error => {
                // Transport error: retry polling
                if (
                  error &&
                  error instanceof TransportStatusError &&
                  // @ts-expect-error TransportStatusError is not a class
                  error.statusCode === 0x6d06
                ) {
                  console.log(
                    `SyncOnboarding: 0x6d06 error 🔨 ${JSON.stringify(error)}`,
                  );
                  return of(error);
                }
                // Disconnection error: retry polling
                if (
                  error &&
                  error instanceof Error &&
                  error.name === "DisconnectedDevice"
                ) {
                  console.log(
                    `SyncOnboarding: disconnection error 🔌 ${JSON.stringify(
                      error,
                    )}`,
                  );
                  return of(error);
                }

                console.log(
                  `SyncOnboarding: 💥 Error ${error} -> ${JSON.stringify(
                    error,
                  )}`,
                );
                return throwError(error);
              }),
              tap(() => console.log("Going to retry in 🕐️ ...")),
              delayWhen(() => timer(pollingFrequencyMs)),
              tap(() => console.log("Retrying 🏃️ !")),
            ),
          ),
          map((deviceVersion: FirmwareInfo) =>
            extractOnboardingState(deviceVersion.flags),
          ),
        )
        .subscribe({
          next: (onboardingState: OnboardingState | null) => {
            console.log(
              `SyncOnboarding: device version info ${JSON.stringify(
                onboardingState,
              )}`,
            );
            // FIXME: if null -> initialState ? What should be the initialOnboardingState ?
            // Does not update the state if it could not be extracted from the flags
            if (onboardingState) {
              setOnboardingState(onboardingState);
            }
          },
          error: error =>
            console.log(
              `SyncOnboarding: error ending polling ${error} -> ${JSON.stringify(
                { error },
              )}`,
            ),
        });
    }

    return () => {
      console.log("SyncOnboarding: cleaning up polling 🧹");
      onboardingStatePollingSubscription?.unsubscribe();
    };
  }, [device]);

  // Updates UI step index from the onboarding state
  useEffect(() => {
    if (!device) {
      // No device is paired yet
      setStepIndex(0);
    } else if (onboardingState.isConfirmingSeedWords) {
      setStepIndex(3);
    }
    // TODO: cheating - add PIN step once fw has been updated
    else if (
      onboardingState.currentSeedWordIndex === 0 &&
      !onboardingState.isConfirmingSeedWords
    ) {
      setStepIndex(1);
    } else {
      setStepIndex(2);
    }
  }, [onboardingState, device]);

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

  return (
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
  );
};
