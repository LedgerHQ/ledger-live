import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button,
  Flex,
  ScrollContainer,
  ScrollContainerHeader,
  VerticalTimeline,
  Text,
  NumberedList,
  IconBox,
  BoxedIcon,
  InfiniteLoader,
} from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useDispatch } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/lib/onboarding/hooks/useOnboardingStatePolling";
import {
  ChevronBottomMedium,
  CloseMedium,
  ExternalLinkMedium,
  InfoMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { OnboardingStep } from "@ledgerhq/live-common/src/hw/extractOnboardingState";
import { useTheme } from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NavigatorName, ScreenName } from "../../const";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Question from "../../icons/Question";
import HelpDrawer from "./HelpDrawer";
import DesyncDrawer from "./DesyncDrawer";
import ResyncOverlay from "./ResyncOverlay";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import { completeOnboarding } from "../../actions/settings";
import SoftwareChecksStep from "./SoftwareChecksStep";

type Step = {
  status: "completed" | "active" | "inactive";
  deviceStates: OnboardingStep[];
  title: string;
  renderBody?: () => ReactNode;
};

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

const pollingPeriodMs = 1000;
const pollingTimeoutMs = 60000;

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const defaultOnboardingSteps: Step[] = useMemo(
    () => [
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
        deviceStates: [OnboardingStep.Ready],
        title: "Software check",
        renderBody: () => (
          <SoftwareChecksStep onComplete={() => setOnboardingComplete(true)} />
        ),
      },
      {
        status: "inactive",
        deviceStates: [],
        title: "Nano is ready",
      },
    ],
    [],
  );

  const dispatch = useDispatch();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isDesyncDrawerOpen, setDesyncDrawerOpen] = useState<boolean>(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState(
    defaultOnboardingSteps,
  );

  const {
    i18n: { language: locale },
  } = useTranslation();

  const { pairedDevice } = route.params;

  const {
    onboardingState,
    allowedError,
    fatalErrorItem,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs,
    stopPolling,
  });

  // Triggers the pairing if no pairedDevice was given
  useEffect(() => {
    if (!pairedDevice) {
      // @ts-expect-error navigator typing issue
      navigation.replace(ScreenName.PairDevices, {
        onlySelectDeviceWithoutFullAppPairing: true,
        onDoneNavigateTo: ScreenName.SyncOnboardingCompanion,
      });
    }
  }, [navigation, pairedDevice]);

  useEffect(() => {
    const newStepState: Step[] = [];

    const needToUpdateSteps = defaultOnboardingSteps.some(
      (step, index, steps) => {
        if (
          !onboardingComplete &&
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

    if (needToUpdateSteps || onboardingComplete) {
      setOnboardingSteps(newStepState);
    }
  }, [onboardingState, onboardingComplete, defaultOnboardingSteps]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOnPaired = useCallback((pairedDevice: Device) => {
    setDevice(pairedDevice);
  }, []);

  const handleTimerRunsOut = useCallback(() => {
    setDesyncDrawerOpen(true);
  }, [setDesyncDrawerOpen]);

  const handleDesyncClose = useCallback(() => {
    setDesyncDrawerOpen(false);
    navigation.navigate(ScreenName.OnboardingWelcome);
  }, [navigation]);

  const handleDeviceReady = useCallback(() => {
    dispatch(completeOnboarding());

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [dispatch, navigation]);

  // Triggered when a new paired device is passed when navigating to this screen
  // It avoids having a callback function passed to the PairDevices screen
  useEffect(() => {
    if (pairedDevice) {
      handleOnPaired(pairedDevice);
    }
  }, [pairedDevice, handleOnPaired]);

  // useEffect(() => {
  //   TODO: handle fatal errors
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
  }, [allowedError, timer]);

  useEffect(() => {
    if (isDesyncDrawerOpen) {
      setStopPolling(true);
    }
  }, [isDesyncDrawerOpen]);

  useEffect(() => {
    if (onboardingComplete) {
      setTimeout(handleDeviceReady, 3000);
    }
  }, [onboardingComplete, handleDeviceReady]);

  if (!pairedDevice) {
    // TODO: do something better here
    return <Flex />;
  }

  return (
    <SafeAreaView>
      <Flex height="100%" position="relative">
        <HelpDrawer
          isOpen={isHelpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
        />
        <DesyncDrawer isOpen={isDesyncDrawerOpen} onClose={handleDesyncClose} />
        <ResyncOverlay isOpen={!!timer && !stopPolling} />
        <ScrollContainer>
          <ScrollContainerHeader>
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              pt={7}
              px={7}
            >
              <LanguageSelect />
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
                // size="small"

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
