import React, {
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Button,
  Flex,
  ScrollContainer,
  VerticalTimeline,
  Text,
} from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useDispatch } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/lib/onboarding/hooks/useOnboardingStatePolling";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { OnboardingStep as DeviceOnboardingStep } from "@ledgerhq/live-common/src/hw/extractOnboardingState";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { fromSeedPhraseTypeToNbOfSeedWords } from "@ledgerhq/live-common/lib/hw/extractOnboardingState";
import { NavigatorName, ScreenName } from "../../const";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Question from "../../icons/Question";
import HelpDrawer from "./HelpDrawer";
import DesyncDrawer from "./DesyncDrawer";
import ResyncOverlay from "./ResyncOverlay";
import LanguageSelect from "./LanguageSelect";
import { completeOnboarding } from "../../actions/settings";
import SoftwareChecksStep from "./SoftwareChecksStep";

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: CompanionStepKey;
  status: StepStatus;
  title: string;
  estimatedTime?: number;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
};

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

const pollingPeriodMs = 1000;
const pollingTimeoutMs = 60000;
const readyRedirectDelay = 2500;
const shortResyncDelay = 1000;
const longResyncDelay = 10000;

/* eslint-disable no-unused-vars */
// Because of https://github.com/typescript-eslint/typescript-eslint/issues/1197
enum CompanionStepKey {
  Paired = 0,
  Pin,
  Seed,
  SoftwareCheck,
  Ready,
  Exit,
}
/* eslint-enable no-unused-vars */

function nextStepKey(step: CompanionStepKey): CompanionStepKey {
  if (step === CompanionStepKey.Ready) {
    return CompanionStepKey.Ready;
  }
  return step + 1;
}

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const { device } = route.params;

  const defaultCompanionSteps: Step[] = useMemo(
    () => [
      {
        key: CompanionStepKey.Paired,
        title: "Nano is paired",
        status: "inactive",
        renderBody: () => (
          <Text variant="bodyLineHeight">
            {`Continue setting up on your Nano and look back here for step by step assistance.`}
          </Text>
        ),
      },
      {
        key: CompanionStepKey.Pin,
        title: "Choose your PIN",
        status: "inactive",
        estimatedTime: 120,
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
        key: CompanionStepKey.Seed,
        title: "Set your recovery phrase",
        status: "inactive",
        estimatedTime: 300,
        renderBody: () => (
          <Text variant="bodyLineHeight">
            {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
          </Text>
        ),
      },
      {
        key: CompanionStepKey.SoftwareCheck,
        title: "Operating system check",
        status: "inactive",
        renderBody: (isDisplayed?: boolean) => (
          <SoftwareChecksStep
            device={device}
            isDisplayed={isDisplayed}
            onComplete={() =>
              setCompanionStepKey(nextStepKey(CompanionStepKey.SoftwareCheck))
            }
          />
        ),
      },
      {
        key: CompanionStepKey.Ready,
        title: "Nano is ready",
        status: "inactive",
      },
    ],
    [device],
  );

  const dispatch = useDispatch();
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [resyncDelay, setResyncDelay] = useState<number>(shortResyncDelay);
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isDesyncDrawerOpen, setDesyncDrawerOpen] = useState<boolean>(false);
  const [companionSteps, setCompanionSteps] = useState<Step[]>(
    defaultCompanionSteps,
  );
  const [companionStepKey, setCompanionStepKey] = useState<CompanionStepKey>(
    CompanionStepKey.Paired,
  );

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    // fatalErrorItem,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs,
    stopPolling,
  });

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleTimerRunsOut = useCallback(() => {
    setDesyncDrawerOpen(true);
  }, [setDesyncDrawerOpen]);

  const handleDesyncClose = useCallback(() => {
    setDesyncDrawerOpen(false);
    // Replace to avoid going back to this screen without re-rendering
    navigation.replace(ScreenName.BleDevicesScanning as "BleDevicesScanning");
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
  }, [allowedError, handleTimerRunsOut, timer]);

  useEffect(() => {
    if (isDesyncDrawerOpen) {
      setStopPolling(true);
    }
  }, [isDesyncDrawerOpen]);

  useEffect(() => {
    if (deviceOnboardingState?.isOnboarded) {
      setCompanionStepKey(CompanionStepKey.SoftwareCheck);
      return;
    }

    switch (deviceOnboardingState?.currentOnboardingStep) {
      case DeviceOnboardingStep.RestoreSeed:
      case DeviceOnboardingStep.SafetyWarning:
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setCompanionStepKey(CompanionStepKey.Seed);
        break;
      case DeviceOnboardingStep.WelcomeScreen:
      case DeviceOnboardingStep.SetupChoice:
        setCompanionStepKey(CompanionStepKey.Paired);
        break;
      case DeviceOnboardingStep.Pin:
        setCompanionStepKey(CompanionStepKey.Pin);
        break;
      default:
        break;
    }
  }, [deviceOnboardingState]);

  // When the user gets close to the seed generation step, sets the lost synchronization delay
  // to a higher value. It avoids having a warning message while the connection is lost because
  // the device is generating the seed.
  useEffect(() => {
    if (
      deviceOnboardingState?.seedPhraseType &&
      [
        DeviceOnboardingStep.NewDeviceConfirming,
        DeviceOnboardingStep.RestoreSeed,
      ].includes(deviceOnboardingState?.currentOnboardingStep)
    ) {
      const nbOfSeedWords = fromSeedPhraseTypeToNbOfSeedWords.get(
        deviceOnboardingState.seedPhraseType,
      );

      if (
        nbOfSeedWords &&
        deviceOnboardingState?.currentSeedWordIndex >= nbOfSeedWords - 1
      ) {
        setResyncDelay(longResyncDelay);
      } else {
        setResyncDelay(shortResyncDelay);
      }
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (companionStepKey >= CompanionStepKey.SoftwareCheck) {
      setStopPolling(true);
    }

    if (companionStepKey === CompanionStepKey.Ready) {
      setTimeout(
        () => setCompanionStepKey(CompanionStepKey.Exit),
        readyRedirectDelay / 2,
      );
    }

    if (companionStepKey === CompanionStepKey.Exit) {
      setTimeout(handleDeviceReady, readyRedirectDelay / 2);
    }

    setCompanionSteps(
      defaultCompanionSteps.map(step => {
        const stepStatus =
          step.key > companionStepKey
            ? "inactive"
            : step.key < companionStepKey
            ? "completed"
            : "active";

        return {
          ...step,
          status: stepStatus,
        };
      }),
    );
  }, [companionStepKey, defaultCompanionSteps, handleDeviceReady]);

  return (
    <SafeAreaView>
      <Flex bg="background.main" height="100%" position="relative">
        <HelpDrawer
          isOpen={isHelpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
        />
        <DesyncDrawer
          isOpen={isDesyncDrawerOpen}
          onClose={handleDesyncClose}
          navigation={navigation}
        />
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          pt={7}
          px={7}
          pb={4}
        >
          <LanguageSelect />
          <Button type="default" Icon={CloseMedium} onPress={handleClose} />
        </Flex>
        <Flex flex={1}>
          <ResyncOverlay isOpen={!!timer && !stopPolling} delay={resyncDelay} />
          <ScrollContainer>
            <Flex px={7} pt={2}>
              <Flex mb={7} flexDirection="row" alignItems="center">
                <Text variant="h4" fontWeight="semiBold">
                  Setup your Nano
                </Text>
                <Button
                  ml={2}
                  Icon={Question}
                  onPress={() => setHelpDrawerOpen(true)}
                />
              </Flex>
              <VerticalTimeline steps={companionSteps} />
            </Flex>
          </ScrollContainer>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};
