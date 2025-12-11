import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import {
  Aside,
  Button,
  Drawer,
  Flex,
  IconsLegacy,
  InfiniteLoader,
  Logos,
  ProgressBar,
} from "@ledgerhq/react-ui";
import { Direction } from "@ledgerhq/react-ui/components/layout/Drawer/index";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  saveSettings,
  setOnboardingUseCase,
  setHasRedirectedToPostOnboarding,
  setHasBeenUpsoldRecover,
  setLastOnboardedDevice,
} from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { HideRecoverySeed } from "~/renderer/components/Onboarding/Help/HideRecoverySeed";
import { PinHelp } from "~/renderer/components/Onboarding/Help/PinHelp";
import { RecoverySeed } from "~/renderer/components/Onboarding/Help/RecoverySeed";
import { DeviceHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/DeviceHowTo";
import { DeviceHowTo2 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/DeviceHowTo2";
import { ExistingRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/ExistingRecoveryPhrase";
import { GenuineCheck } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/GenuineCheck";
import { HideRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/HideRecoveryPhrase";
import { HowToGetStarted } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/HowToGetStarted";
import { ImportYourRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/ImportYourRecoveryPhrase";
import { NewRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/NewRecoveryPhrase";
import { PairMyNano } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PairMyNano";
import { PinCode } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PinCode";
import { PinCodeHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PinCodeHowTo";
import { QuizFailure } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/QuizFailure";
import { QuizSuccess } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/QuizSuccess";
import { RecoverHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoverHowTo";
import { RecoverPinCodeHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoverPinCodeHowTo";
import { RecoveryHowTo1 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoveryHowTo1";
import { RecoveryHowTo2 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoveryHowTo2";
import { RecoveryHowTo3 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoveryHowTo3";
import { UseRecoverySheet } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/UseRecoverySheet";
import { openURL } from "~/renderer/linking";
import { QuizzPopin } from "~/renderer/modals/OnboardingQuizz/OnboardingQuizzModal";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import RecoveryWarning from "../../Help/RecoveryWarning";
import { OnboardingUseCase } from "../../OnboardingUseCase";
import { urls } from "~/config/urls";
import { useRecoverRestoreOnboarding } from "~/renderer/hooks/useRecoverRestoreOnboarding";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";
import { SecureYourCrypto } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/SecureYourCrypto";
import { WelcomeToWalletWithFunds } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/WelcomeToWalletWithFunds";
import { WelcomeToWalletWithoutFunds } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/WelcomeToWalletWithoutFunds";
import {
  onboardingReceiveFlowSelector,
  onboardingReceiveSuccessSelector,
  setIsOnboardingReceiveFlow,
} from "~/renderer/reducers/onboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { DeviceModelId } from "@ledgerhq/devices";
import { EnableSync } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/EnableSync";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/lib-es/store";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

const FlowStepperContainer = styled(Flex)`
  width: 100%;
  height: 100%;
`;

const FlowStepperContentContainer = styled(Flex)`
  height: 100%;
  width: 50%;
  padding: ${p => p.theme.space[10]}px;
`;

const FlowStepperContent = styled(Flex)`
  min-width: 514px;
  max-width: 1022px;
  height: 100%;
  width: 70%;
`;

const StepContent = styled.div`
  flex-grow: 1;
  margin-top: ${p => p.theme.space[10]}px;
  margin-bottom: ${p => p.theme.space[10]}px;
  width: 100%;
`;

type FlowStepperProps = {
  illustration?: React.ReactNode;
  content?: React.ReactNode;
  AsideFooter?: React.ElementType;
  ProgressBar?: React.ReactNode;
  continueLabel?: string;
  continueLabelSecondary?: string;
  continueLoading?: boolean;
  continueDisabled?: boolean;
  backLabel?: string;
  disableBack?: boolean;
  children: React.ReactNode;
  handleBack?: () => void;
  handleContinue: () => void;
  handleContinueSecondary?: () => void;
};

const FooterContainer = styled(Flex).attrs({ rowGap: 3, height: 120 })`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
`;

const FlowStepper: React.FC<FlowStepperProps> = ({
  illustration,
  AsideFooter,
  continueLabel,
  continueLabelSecondary,
  backLabel,
  continueLoading,
  continueDisabled,
  disableBack,
  ProgressBar,
  children,
  handleBack,
  handleContinue,
  handleContinueSecondary,
}) => {
  const urlFaq = useLocalizedUrl(urls.faq);
  const nanoOnboardingFundWalletFeature = useFeature("nanoOnboardingFundWallet")?.enabled;

  const handleHelp = () => openURL(urlFaq);

  const { t } = useTranslation();

  const Footer = (
    <FooterContainer>{AsideFooter ? <AsideFooter onClick={handleHelp} /> : null}</FooterContainer>
  );

  return (
    <FlowStepperContainer>
      {!nanoOnboardingFundWalletFeature && (
        <Aside
          backgroundColor="constant.purple"
          header={
            <Flex justifyContent="center">
              <Logos.LedgerLiveRegular width={155} height={32} />
            </Flex>
          }
          footer={Footer}
          width="324px"
          p={10}
          position="relative"
        >
          {illustration}
        </Aside>
      )}
      <FlowStepperContentContainer flexGrow={1} justifyContent="center">
        <FlowStepperContent flexDirection="column" /* Agrandir ici */>
          {ProgressBar}
          <StepContent>{children}</StepContent>
          <Flex justifyContent={handleBack ? "space-between" : "flex-end"}>
            {handleBack && (
              <Button
                iconPosition="left"
                onClick={handleBack}
                disabled={disableBack}
                variant="main"
                outline
                Icon={() => <IconsLegacy.ArrowLeftMedium size={18} />}
              >
                {backLabel || t("common.back")}
              </Button>
            )}
            <Flex columnGap="16px">
              {handleContinueSecondary && (
                <Button
                  data-testid="v3-tutorial-continue-secondary"
                  onClick={handleContinueSecondary}
                  disabled={continueLoading || continueDisabled}
                >
                  {continueLabelSecondary || t("common.continue")}
                </Button>
              )}
              <Button
                data-testid="v3-tutorial-continue"
                onClick={handleContinue}
                disabled={continueLoading || continueDisabled}
                variant="main"
                iconSize={18}
                Icon={continueLoading ? InfiniteLoader : IconsLegacy.ArrowRightMedium}
              >
                {continueLabel || t("common.continue")}
              </Button>
            </Flex>
          </Flex>
        </FlowStepperContent>
      </FlowStepperContentContainer>
    </FlowStepperContainer>
  );
};

export enum ScreenId {
  howToGetStarted = "how-to-get-started",
  deviceHowTo = "device-how-to",
  deviceHowTo2 = "device-how-to-2",
  pinCode = "pin-code",
  pinCodeHowTo = "pin-code-how-to",
  newRecoveryPhrase = "new-recovery-phrase",
  useRecoverySheet = "use-recovery-sheet",
  recoveryHowTo = "recovery-how-to",
  recoveryHowTo2 = "recovery-how-to-2",
  recoveryHowTo3 = "recovery-how-to-3",
  hideRecoveryPhrase = "hide-recovery-phrase",
  importYourRecoveryPhrase = "import-your-recovery-phrase",
  existingRecoveryPhrase = "existing-recovery-phrase",
  quizSuccess = "quiz-success",
  quizFailure = "quiz-failure",
  pairMyNano = "pair-my-nano",
  genuineCheck = "genuine-check",
  recoverHowTo = "recover-how-to",
  enableSync = "enable-sync",
  secureYourCrypto = "secure-your-crypto",
  welcomeToWalletWithFunds = "welcome-to-wallet-with-funds",
  welcomeToWalletWithoutFunds = "welcome-to-wallet-without-funds",
}

type ScreenComponent =
  | typeof HowToGetStarted
  | typeof DeviceHowTo
  | typeof DeviceHowTo2
  | typeof PinCode
  | typeof PinCodeHowTo
  | typeof NewRecoveryPhrase
  | typeof UseRecoverySheet
  | typeof RecoveryHowTo1
  | typeof RecoveryHowTo2
  | typeof RecoveryHowTo3
  | typeof HideRecoveryPhrase
  | typeof ImportYourRecoveryPhrase
  | typeof ExistingRecoveryPhrase
  | typeof QuizSuccess
  | typeof QuizFailure
  | typeof PairMyNano
  | typeof GenuineCheck
  | typeof RecoverHowTo
  | typeof SecureYourCrypto
  | typeof WelcomeToWalletWithFunds
  | typeof WelcomeToWalletWithoutFunds;

interface IScreen {
  id: ScreenId;
  component: ScreenComponent;
  useCases?: OnboardingUseCase[];
  next: () => void;
  nextSecondary?: () => void;
  previous?: () => void;
  canContinue?: boolean;
  props?: { [key: string]: unknown };
}

type Props = {
  useCase: OnboardingUseCase;
  deviceModelId: DeviceModelId | null;
};

function useRedirectToPortfolio({
  enabled,
  useCase,
}: {
  enabled: boolean;
  useCase: OnboardingUseCase;
}) {
  const redirectToPostOnboarding = useRedirectToPostOnboardingCallback();
  useEffect(() => {
    if (enabled) {
      /**
       * There is a lag if we call history.push("/") directly.
       * To improve the UX in that situation, we have to first commit a "loading"
       * state and then when that state is rendered (which will be when this
       * block is executed), on the following commit we can call
       * history.push("/").
       */
      const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
        redirectToPostOnboarding();
      }, 0);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [enabled, redirectToPostOnboarding, useCase]);
}

const USE_CASE_SEED_CONFIG = {
  [OnboardingUseCase.setupDevice]: "new_seed",
  [OnboardingUseCase.recoveryPhrase]: "restore_seed",
  [OnboardingUseCase.recover]: "recover_seed",
  [OnboardingUseCase.connectDevice]: "connect",
};

export default function Tutorial({ useCase, deviceModelId }: Props) {
  const trackProperties = useMemo(() => {
    return {
      seedConfiguration: USE_CASE_SEED_CONFIG[useCase],
      deviceModelId,
    };
  }, [deviceModelId, useCase]);
  const history = useHistory<{ fromRecover: boolean } | undefined>();
  const [quizzOpen, setQuizOpen] = useState(false);
  const [syncDrawerOpen, setSyncDrawerOpen] = useState(false);
  const isOnboardingReceiveFlow = useSelector(onboardingReceiveFlowSelector);
  const isOnboardingReceiveSuccess = useSelector(onboardingReceiveSuccessSelector);
  const isLedgerSyncActive = Boolean(useSelector(trustchainSelector)?.rootId);
  const nanoOnboardingFundWalletFeature = useFeature("nanoOnboardingFundWallet")?.enabled;
  const nanoOnboardingEnableSyncFeature = useFeature("onboardingEnableSync")?.params?.nanos;
  const initialIsLedgerSyncActive = useRef(isLedgerSyncActive);
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const recoverFF = useFeature("protectServicesDesktop");
  const recoverRestorePath = useCustomPath(recoverFF, "restore", "lld-restore-with-recover");
  const recoverDiscoverPath = useMemo(() => {
    return `/recover/${recoverFF?.params?.protectId}?redirectTo=disclaimerRestore`;
  }, [recoverFF?.params?.protectId]);

  const [userUnderstandConsequences, setUserUnderstandConsequences] = useState(false);
  const [userChosePinCodeHimself, setUserChosePinCodeHimself] = useState(false);

  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const [onboardingDone, setOnboardingDone] = useState(false);

  const [helpPinCode, setHelpPinCode] = useState(false);
  const [helpRecoveryPhrase, setHelpRecoveryPhrase] = useState(false);
  const [helpHideRecoveryPhrase, setHelpHideRecoveryPhrase] = useState(false);
  const [helpRecoveryPhraseWarning, setHelpRecoveryPhraseWarning] = useState(false);

  const urlSplit = useMemo(() => pathname.split("/"), [pathname]);
  const currentStep = useMemo(() => urlSplit[urlSplit.length - 1], [urlSplit]);
  const path = useMemo(() => urlSplit.slice(0, urlSplit.length - 1).join("/"), [urlSplit]);

  const dispatch = useDispatch();

  useRedirectToPortfolio({
    enabled: onboardingDone,
    useCase,
  });

  // Keep the state coming from react-router in a local state
  // as location.state will be undefined when navigating to other steps
  const [fromRecover, setFromRecover] = useState(false);
  useEffect(() => {
    if (history.location.state) {
      setFromRecover(history.location.state.fromRecover);
    }
  }, [history.location.state]);

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "receive",
    "MODAL_RECEIVE",
  );

  const { openDrawer, closeDrawer } = useLedgerSyncEntryPointViewModel({
    entryPoint: EntryPoint.onboarding,
    needEligibleDevice: true,
    skipFirstScreen: true,
  });

  const completeOnboarding = useCallback(() => {
    dispatch(
      saveSettings({
        hasCompletedOnboarding: true,
      }),
    );
    dispatch(setLastOnboardedDevice(connectedDevice));
    dispatch(setOnboardingUseCase(useCase));
    dispatch(setHasRedirectedToPostOnboarding(false));
    dispatch(setHasBeenUpsoldRecover(false));
    track("Onboarding - End", trackProperties);
    setOnboardingDone(true);
  }, [dispatch, connectedDevice, useCase, trackProperties]);

  const screens = useMemo<IScreen[]>(() => {
    const unfilteredScreens = [
      {
        id: ScreenId.howToGetStarted,
        component: HowToGetStarted,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          track("Onboarding - Get started step 1", trackProperties);
          history.push(`${path}/${ScreenId.deviceHowTo}`);
        },
        previous: () => history.push("/onboarding/select-use-case"),
      },
      {
        id: ScreenId.deviceHowTo,
        component: DeviceHowTo,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => history.push(`${path}/${ScreenId.pinCode}`),
        previous: () => history.push(`${path}/${ScreenId.howToGetStarted}`),
      },
      {
        id: ScreenId.deviceHowTo2,
        component: DeviceHowTo2,
        useCases: [OnboardingUseCase.setupDevice, OnboardingUseCase.recoveryPhrase],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            history.push(`${path}/${ScreenId.deviceHowTo2}`);
          }
          // useCase === UseCase.recoveryPhrase
          else {
            history.push(`${path}/${ScreenId.pinCode}`);
          }
        },
        previous: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            history.push(`${path}/${ScreenId.howToGetStarted}`);
          }
          // useCase === UseCase.recoveryPhrase
          else {
            history.push(`${path}/${ScreenId.importYourRecoveryPhrase}`);
          }
        },
      },
      {
        id: ScreenId.pinCode,
        component: PinCode,
        props: {
          toggleUserChosePinCodeHimself: () => {
            setUserChosePinCodeHimself(!userChosePinCodeHimself);
          },
          userChosePinCodeHimself,
        },
        useCases: [
          OnboardingUseCase.setupDevice,
          OnboardingUseCase.recoveryPhrase,
          OnboardingUseCase.recover,
        ],
        canContinue: userChosePinCodeHimself,
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Pin code step 1", trackProperties);
          }
          history.push(`${path}/${ScreenId.pinCodeHowTo}`);
        },
        previous: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            history.push(`${path}/${ScreenId.deviceHowTo}`);
          } else if (useCase === OnboardingUseCase.recover) {
            history.push(`${path}/${ScreenId.recoverHowTo}`);
          }
          // useCase === UseCase.recoveryPhrase
          else {
            history.push(`${path}/${ScreenId.deviceHowTo2}`);
          }
        },
      },
      {
        id: ScreenId.pinCodeHowTo,
        component: useCase === OnboardingUseCase.recover ? RecoverPinCodeHowTo : PinCodeHowTo,
        useCases: [
          OnboardingUseCase.setupDevice,
          OnboardingUseCase.recoveryPhrase,
          OnboardingUseCase.recover,
        ],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Pin code step 2", trackProperties);
            // setHelpPinCode(true);
          }
          setHelpPinCode(true);
          // useCase === UseCase.recoveryPhrase
          /* else {
              history.push(`${path}/${ScreenId.existingRecoveryPhrase}`);
            } */
        },
        previous: () => history.push(`${path}/${ScreenId.pinCode}`),
      },
      {
        id: ScreenId.newRecoveryPhrase,
        component: NewRecoveryPhrase,
        props: {
          toggleUserUnderstandConsequences: () => {
            setUserUnderstandConsequences(!userUnderstandConsequences);
          },
          userUnderstandConsequences,
        },
        useCases: [OnboardingUseCase.setupDevice],
        canContinue: userUnderstandConsequences,
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Recovery step 1", trackProperties);
          }
          history.push(`${path}/${ScreenId.useRecoverySheet}`);
        },
        previous: () => history.push(`${path}/${ScreenId.pinCodeHowTo}`),
      },
      {
        id: ScreenId.useRecoverySheet,
        component: UseRecoverySheet,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Recovery step 2", trackProperties);
          }
          history.push(`${path}/${ScreenId.recoveryHowTo3}`);
        },
        previous: () => history.push(`${path}/${ScreenId.newRecoveryPhrase}`),
      },
      {
        id: ScreenId.recoveryHowTo,
        component: RecoveryHowTo1,
        useCases: [OnboardingUseCase.recoveryPhrase],
        next: () => history.push(`${path}/${ScreenId.recoveryHowTo2}`),
        previous: () => history.push(`${path}/${ScreenId.existingRecoveryPhrase}`),
      },
      {
        id: ScreenId.recoveryHowTo2,
        component: RecoveryHowTo2,
        useCases: [OnboardingUseCase.recoveryPhrase],
        next: () => {
          setHelpRecoveryPhrase(true);
        },
        previous: () => history.push(`${path}/${ScreenId.recoveryHowTo}`),
      },
      {
        id: ScreenId.recoveryHowTo3,
        component: RecoveryHowTo3,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Recovery step 3", trackProperties);
          }
          setHelpRecoveryPhrase(true);
        },
        previous: () => history.push(`${path}/${ScreenId.useRecoverySheet}`),
      },
      {
        id: ScreenId.hideRecoveryPhrase,
        component: HideRecoveryPhrase,
        props: {
          handleHelp: () => {
            track("Onboarding - Recovery step 4 - HELP CLICK", trackProperties);
            setHelpHideRecoveryPhrase(true);
          },
        },
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Recovery step 4", trackProperties);
          }
          setHelpHideRecoveryPhrase(true);
        },
        previous: () => history.push(`${path}/${ScreenId.recoveryHowTo3}`),
      },
      {
        id: ScreenId.importYourRecoveryPhrase,
        component: ImportYourRecoveryPhrase,
        useCases: [OnboardingUseCase.setupDevice, OnboardingUseCase.recoveryPhrase],
        next: () => history.push(`${path}/${ScreenId.deviceHowTo2}`),
        previous: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            history.push("/onboarding/select-use-case");
          } else {
            history.push("/onboarding/select-use-case");
          }
        },
      },
      {
        id: ScreenId.existingRecoveryPhrase,
        component: ExistingRecoveryPhrase,
        props: {
          userUnderstandConsequences,
          toggleUserUnderstandConsequences: () => {
            setUserUnderstandConsequences(!userUnderstandConsequences);
          },
        },
        useCases: [OnboardingUseCase.recoveryPhrase],
        next: () => history.push(`${path}/${ScreenId.recoveryHowTo}`),
        previous: () => history.push(`${path}/${ScreenId.pinCodeHowTo}`),
        canContinue: userUnderstandConsequences,
      },
      {
        id: ScreenId.quizSuccess,
        component: QuizSuccess,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Pair start", trackProperties);
          }
          history.push(`${path}/${ScreenId.pairMyNano}`);
        },
        previous: () => history.push(`${path}/${ScreenId.hideRecoveryPhrase}`),
      },
      {
        id: ScreenId.quizFailure,
        component: QuizFailure,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Pair start", trackProperties);
          }
          history.push(`${path}/${ScreenId.pairMyNano}`);
        },
        previous: () => history.push(`${path}/${ScreenId.hideRecoveryPhrase}`),
      },
      {
        id: ScreenId.pairMyNano,
        component: PairMyNano,
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            track("Onboarding - Genuine Check", trackProperties);
          }
          if (useCase === OnboardingUseCase.recover) {
            history.push(`${path}/${ScreenId.recoverHowTo}`);
            return;
          }
          history.push(`${path}/${ScreenId.genuineCheck}`);
        },
        previous: () => {
          if (useCase === OnboardingUseCase.recover && fromRecover) {
            history.push(recoverDiscoverPath);
          } else if (
            [OnboardingUseCase.connectDevice, OnboardingUseCase.recover].includes(useCase)
          ) {
            history.push("/onboarding/select-use-case");
          } else if (useCase === OnboardingUseCase.setupDevice) {
            history.push(`${path}/${ScreenId.hideRecoveryPhrase}`);
          }
          // useCase === UseCase.recoveryPhrase
          else {
            history.push(`${path}/${ScreenId.recoveryHowTo2}`);
          }
        },
      },
      {
        id: ScreenId.genuineCheck,
        component: GenuineCheck,
        props: {
          connectedDevice,
          setConnectedDevice,
        },
        canContinue: !!connectedDevice,
        next: () => {
          if (useCase === OnboardingUseCase.setupDevice) {
            if (nanoOnboardingFundWalletFeature) {
              if (nanoOnboardingEnableSyncFeature && !isLedgerSyncActive) {
                history.push(`${path}/${ScreenId.enableSync}`);
                return;
              } else {
                history.push(`${path}/${ScreenId.secureYourCrypto}`);
                return;
              }
            }
          }
          completeOnboarding();
        },
        previous: () => history.push(`${path}/${ScreenId.pairMyNano}`),
      },
      {
        id: ScreenId.recoverHowTo,
        component: RecoverHowTo,
        useCases: [OnboardingUseCase.recover],
        next: () => {
          // TODO in next ticket
          history.push(`${path}/${ScreenId.pinCode}`);
        },
        previous: () =>
          fromRecover
            ? history.push(recoverDiscoverPath)
            : history.push("/onboarding/select-use-case"),
      },
      {
        id: ScreenId.enableSync,
        component: EnableSync,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          track("Onboarding - Enable sync", trackProperties);
          openDrawer();
          setSyncDrawerOpen(true);
        },
        nextSecondary: () => history.push(`${path}/${ScreenId.secureYourCrypto}`),
        previous: () => history.push(`${path}/${ScreenId.genuineCheck}`),
      },
      {
        id: ScreenId.secureYourCrypto,
        component: SecureYourCrypto,
        useCases: [OnboardingUseCase.setupDevice],
        next: () => {
          track("Onboarding - Secure my crypto", trackProperties);
          dispatch(
            setIsOnboardingReceiveFlow({
              isFlow: true,
              isSuccess: false,
            }),
          );
          openAssetFlow();
        },
        nextSecondary: () => {
          track("Onboarding - Maybe later", trackProperties);
          history.push(`${path}/${ScreenId.welcomeToWalletWithoutFunds}`);
        },
        previous: () => {
          if (nanoOnboardingEnableSyncFeature) {
            history.push(`${path}/${ScreenId.enableSync}`);
            return;
          }
          history.push(`${path}/${ScreenId.genuineCheck}`);
        },
      },
      {
        id: ScreenId.welcomeToWalletWithFunds,
        component: WelcomeToWalletWithFunds,
        useCases: [OnboardingUseCase.setupDevice],
        next: completeOnboarding,
      },
      {
        id: ScreenId.welcomeToWalletWithoutFunds,
        component: WelcomeToWalletWithoutFunds,
        useCases: [OnboardingUseCase.setupDevice],
        next: completeOnboarding,
      },
    ];

    if (nanoOnboardingFundWalletFeature) {
      if (nanoOnboardingEnableSyncFeature && !initialIsLedgerSyncActive.current) {
        return unfilteredScreens;
      } else {
        return unfilteredScreens.filter(({ id }) => id !== ScreenId.enableSync);
      }
    }

    return unfilteredScreens.filter(
      ({ id }) =>
        ![
          ScreenId.enableSync,
          ScreenId.secureYourCrypto,
          ScreenId.welcomeToWalletWithFunds,
          ScreenId.welcomeToWalletWithoutFunds,
        ].includes(id),
    );
  }, [
    completeOnboarding,
    connectedDevice,
    dispatch,
    fromRecover,
    history,
    initialIsLedgerSyncActive,
    isLedgerSyncActive,
    nanoOnboardingEnableSyncFeature,
    nanoOnboardingFundWalletFeature,
    openAssetFlow,
    openDrawer,
    path,
    recoverDiscoverPath,
    trackProperties,
    useCase,
    userChosePinCodeHimself,
    userUnderstandConsequences,
  ]);

  const steps = useMemo(() => {
    const stepList = [
      {
        name: "getStarted",
        screens: [
          ScreenId.howToGetStarted,
          ScreenId.deviceHowTo,
          ScreenId.deviceHowTo2,
          ScreenId.importYourRecoveryPhrase,
        ],
      },
      {
        name: "pinCode",
        screens: [ScreenId.pinCode, ScreenId.pinCodeHowTo],
      },
      {
        name: "recoveryPhrase",
        screens: [
          ScreenId.newRecoveryPhrase,
          ScreenId.useRecoverySheet,
          ScreenId.existingRecoveryPhrase,
          ScreenId.recoveryHowTo,
          ScreenId.recoveryHowTo2,
          ScreenId.recoveryHowTo3,
        ],
      },
      {
        name: "hideRecoveryPhrase",
        screens: [ScreenId.hideRecoveryPhrase, ScreenId.quizSuccess, ScreenId.quizFailure],
      },
      {
        name: "pairNano",
        screens: [ScreenId.pairMyNano, ScreenId.genuineCheck],
      },
    ];

    if (useCase === OnboardingUseCase.recoveryPhrase) {
      // Remove step : hideRecoveryPhrase
      stepList.splice(3, 1);
    }

    if (useCase === OnboardingUseCase.setupDevice && nanoOnboardingFundWalletFeature) {
      if (nanoOnboardingEnableSyncFeature && !initialIsLedgerSyncActive.current) {
        stepList.push({
          name: "enableSync",
          screens: [ScreenId.enableSync],
        });
      }
      stepList.push({
        name: "secureYourCrypto",
        screens: [
          ScreenId.secureYourCrypto,
          ScreenId.welcomeToWalletWithFunds,
          ScreenId.welcomeToWalletWithoutFunds,
        ],
      });
    }

    return stepList;
  }, [
    nanoOnboardingEnableSyncFeature,
    nanoOnboardingFundWalletFeature,
    useCase,
    initialIsLedgerSyncActive,
  ]);

  const currentScreenIndex = useMemo(
    () => screens.findIndex(s => s.id === currentStep),
    [currentStep, screens],
  );
  const {
    component,
    canContinue,
    next,
    nextSecondary,
    previous,
    id: currentScreenId,
  } = screens[currentScreenIndex];
  const CurrentScreen = component as unknown as {
    Illustration: React.JSX.Element;
    Footer: React.ElementType;
    continueLabel: string;
    continueLabelSecondary: string;
  };

  const screenStepIndex = useMemo(
    () => steps.findIndex(s => !!s.screens.find(screenId => screenId === currentScreenId)),
    [currentScreenId, steps],
  );

  const useCaseScreens = useMemo(
    () =>
      screens.filter(screen => {
        return !screen.useCases || screen.useCases.includes(useCase);
      }),
    [screens, useCase],
  );

  const progressSteps = useMemo(
    () =>
      steps.map(({ name }) => ({
        key: name,
        label: t(`onboarding.screens.tutorial.steps.${name}`),
      })),
    [steps, t],
  );

  const quizSucceeds = useCallback(() => {
    setQuizOpen(false);
    history.push(`${path}/quiz-success`);
  }, [history, path]);

  const quizFails = useCallback(() => {
    setQuizOpen(false);
    history.push(`${path}/quiz-failure`);
  }, [history, path]);

  const handleNextInDrawer = useCallback(
    (closeCurrentDrawer: (bool: boolean) => void, targetPath: string | object) => {
      closeCurrentDrawer(false);
      history.push(targetPath);
    },
    [history],
  );

  const { confirmRecoverOnboardingStatus } = useRecoverRestoreOnboarding();

  const handleNextPin = useCallback(() => {
    let targetPath: string | object = `${path}/${ScreenId.existingRecoveryPhrase}`;

    if (useCase === OnboardingUseCase.recover && recoverRestorePath) {
      const [pathname, search] = recoverRestorePath.split("?");
      targetPath = {
        pathname,
        search: search ? `?${search}` : undefined,
        state: { deviceId: connectedDevice?.deviceId },
      };

      confirmRecoverOnboardingStatus();
    }

    if (useCase === OnboardingUseCase.setupDevice) {
      targetPath = `${path}/${ScreenId.newRecoveryPhrase}`;
    }

    handleNextInDrawer(setHelpPinCode, targetPath);
  }, [
    confirmRecoverOnboardingStatus,
    connectedDevice?.deviceId,
    handleNextInDrawer,
    path,
    recoverRestorePath,
    useCase,
  ]);

  useEffect(() => {
    if (!isOnboardingReceiveFlow && isOnboardingReceiveSuccess) {
      dispatch(
        setIsOnboardingReceiveFlow({
          isFlow: false,
          isSuccess: false,
        }),
      );
      history.push(`${path}/${ScreenId.welcomeToWalletWithFunds}`);
    }
  }, [
    isOnboardingReceiveFlow,
    isOnboardingReceiveSuccess,
    history,
    path,
    currentScreenId,
    dispatch,
  ]);

  useEffect(() => {
    if (isLedgerSyncActive && currentStep === ScreenId.enableSync && !syncDrawerOpen)
      history.push(`${path}/${ScreenId.secureYourCrypto}`);
  }, [isLedgerSyncActive, history, path, currentStep, syncDrawerOpen]);

  return (
    <>
      <QuizzPopin isOpen={quizzOpen} onWin={quizSucceeds} onLose={quizFails} onClose={quizFails} />
      <Drawer isOpen={helpPinCode} onClose={() => setHelpPinCode(false)} direction={Direction.Left}>
        <Flex px={40} height="100%">
          `
          <PinHelp handleNextInDrawer={handleNextPin} />
        </Flex>
      </Drawer>
      <Drawer
        isOpen={helpRecoveryPhrase}
        onClose={() => setHelpRecoveryPhrase(false)}
        direction={Direction.Left}
      >
        <Flex px={40} height="100%">
          <RecoverySeed
            handleNextInDrawer={() =>
              handleNextInDrawer(
                setHelpRecoveryPhrase,
                useCase === OnboardingUseCase.setupDevice
                  ? `${path}/${ScreenId.hideRecoveryPhrase}`
                  : `${path}/${ScreenId.pairMyNano}`,
              )
            }
          />
        </Flex>
      </Drawer>
      <Drawer
        isOpen={helpHideRecoveryPhrase}
        onClose={() => setHelpHideRecoveryPhrase(false)}
        direction={Direction.Left}
      >
        <Flex px={40} height="100%">
          <HideRecoverySeed
            handleNextInDrawer={() => {
              setQuizOpen(true);
              handleNextInDrawer(
                setHelpHideRecoveryPhrase,
                `${path}/${ScreenId.hideRecoveryPhrase}`,
              );
            }}
          />
        </Flex>
      </Drawer>
      <Drawer
        isOpen={helpRecoveryPhraseWarning}
        onClose={() => setHelpRecoveryPhraseWarning(false)}
        direction={Direction.Left}
      >
        <Flex px={40}>
          <RecoveryWarning />
        </Flex>
      </Drawer>

      <WalletSyncDrawer
        currentPage={AnalyticsPage.Onboarding}
        onClose={() => {
          setSyncDrawerOpen(false);
          closeDrawer();
        }}
      />

      <FlowStepper
        illustration={CurrentScreen.Illustration}
        AsideFooter={CurrentScreen.Footer}
        continueDisabled={canContinue === false}
        ProgressBar={
          useCase !== OnboardingUseCase.connectDevice && useCase !== OnboardingUseCase.recover ? (
            <ProgressBar steps={progressSteps} currentIndex={screenStepIndex} />
          ) : (
            <></>
          )
        }
        continueLabel={CurrentScreen.continueLabel}
        continueLabelSecondary={CurrentScreen.continueLabelSecondary}
        continueLoading={onboardingDone}
        handleContinue={next}
        handleContinueSecondary={nextSecondary}
        handleBack={previous}
      >
        <Switch>
          {useCaseScreens.map(({ component, id, props: screenProps = {} }) => {
            return (
              <Route
                key={id}
                path={`${path}/${id}`}
                render={props => {
                  const Screen: React.ElementType = component;
                  return <Screen {...props} {...screenProps} />;
                }}
              />
            );
          })}
        </Switch>
      </FlowStepper>
    </>
  );
}
