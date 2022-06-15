import React from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { Button, Flex, StepList, Text } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/src/onboarding/hooks/useOnboardingStatePolling";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { OnboardingStep } from "@ledgerhq/live-common/src/hw/extractOnboardingState";
import { useTheme } from "styled-components/native";

import { ScreenName } from "../../const";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/lib/onboarding/hooks/useOnboardingStatePolling";
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
      deviceStates: [OnboardingStep.NewDevice, OnboardingStep.NewDeviceConfirming, OnboardingStep.RestoreSeed, OnboardingStep.SafetyWarning],
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

const pollingPeriodMs = 1000;

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState(defaultOnboardingSteps);

  const { pairedDevice } = route.params; 

  const { onboardingState, allowedError, fatalError } = useOnboardingStatePolling({ device, pollingPeriodMs });

  // Triggers the pairing if no pairedDevice was given
  useEffect(() => {
    if (!pairedDevice) {
      // @ts-expect-error navigator typing issue
      navigation.navigate(ScreenName.PairDevices, {
        onlySelectDeviceWithoutFullAppPairing: true,
        onDoneNavigateTo: ScreenName.SyncOnboardingCompanion,
      });
    }
  }, [navigation, pairedDevice]);

  console.log("Allowed Error:", allowedError);

  console.log("Fatal Error:", fatalError)

  useEffect(() => {
    console.log(onboardingState)
    setOnboardingSteps(defaultOnboardingSteps.map(step => {
      if (onboardingState && onboardingState.currentOnboardingStep && step.deviceStates.includes(onboardingState.currentOnboardingStep)) {
        return {
          ...step,
          status: "active"
        }
      }
      return step;
    }));

  }, [onboardingState]);
 

  const handleOnPaired = useCallback((pairedDevice: Device) => {
    setDevice(pairedDevice);
  }, []);

  // Triggered when a new paired device is passed when navigating to this screen
  // It avoids having a callback function passed to the PairDevices screen
  useEffect(() => {
    if (pairedDevice) {
      handleOnPaired(pairedDevice);
    }
  }, [pairedDevice, handleOnPaired]);

  return (
    <Flex
      px={7}
      py={8}
    >
      <Flex flexDirection="row" justifyContent="space-between" mt={6} mb={8}>
        <Button type="main" outline>EN</Button>
        <Button Icon={CloseMedium} />
      </Flex>
      <Text variant="h4">Setup Manual</Text>
      <Text mb={8} variant="body">Continue setting up on your Nano. Check back here for tips and information.</Text>
      <StepList items={onboardingSteps} />
    </Flex>
  );
};
