import { useFeature, isRecoverDisplayed } from "@ledgerhq/live-config/featureFlags/index";
import {
  useAlreadySeededDevicePath,
  useRestore24Path,
  useUpsellPath,
  useCustomPath,
} from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { saveSettings } from "~/renderer/actions/settings";
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
import { useDynamicUrl } from "~/renderer/terms";
import RecoveryWarning from "../../Help/RecoveryWarning";
import { UseCase } from "../../index";

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
  continueLoading?: boolean;
  continueDisabled?: boolean;
  backLabel?: string;
  disableBack?: boolean;
  children: React.ReactNode;
  handleBack: () => void;
  handleContinue: () => void;
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
  backLabel,
  continueLoading,
  continueDisabled,
  disableBack,
  ProgressBar,
  children,
  handleBack,
  handleContinue,
}) => {
  const urlFaq = useDynamicUrl("faq");

  const handleHelp = () => openURL(urlFaq);

  const { t } = useTranslation();

  const Footer = (
    <FooterContainer>{AsideFooter ? <AsideFooter onClick={handleHelp} /> : null}</FooterContainer>
  );

  return (
    <FlowStepperContainer>
      <Aside
        backgroundColor="palette.constant.purple"
        header={
          <Flex justifyContent="center">
            <Logos.LedgerLiveRegular />
          </Flex>
        }
        footer={Footer}
        width="324px"
        p={10}
        position="relative"
      >
        {illustration}
      </Aside>
      <FlowStepperContentContainer flexGrow={1} justifyContent="center">
        <FlowStepperContent flexDirection="column" /* Agrandir ici */>
          {ProgressBar}
          <StepContent>{children}</StepContent>
          <Flex justifyContent="space-between">
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
            <Button
              data-test-id="v3-tutorial-continue"
              onClick={handleContinue}
              disabled={continueLoading || continueDisabled}
              variant="main"
              iconSize={18}
              Icon={continueLoading ? InfiniteLoader : IconsLegacy.ArrowRightMedium}
            >
              {continueLabel || t("common.continue")}
            </Button>
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
  | typeof RecoverHowTo;

interface IScreen {
  id: ScreenId;
  component: ScreenComponent;
  useCases?: UseCase[];
  next: () => void;
  previous: () => void;
  canContinue?: boolean;
  props?: { [key: string]: unknown };
}

type Props = {
  useCase: UseCase;
};

export default function Tutorial({ useCase }: Props) {
  const history = useHistory<{ fromRecover: boolean } | undefined>();
  const [quizzOpen, setQuizOpen] = useState(false);
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const recoverFF = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverFF);
  const restore24Path = useRestore24Path(recoverFF);
  const devicePairingPath = useAlreadySeededDevicePath(recoverFF);
  const recoverRestorePath = useCustomPath(recoverFF, "restore", "lld-restore-with-recover");
  const recoverDiscoverPath = useMemo(() => {
    return `/recover/${recoverFF?.params?.protectId}?redirectTo=disclaimerRestore`;
  }, [recoverFF?.params?.protectId]);

  const [userUnderstandConsequences, setUserUnderstandConsequences] = useState(false);
  const [userChosePinCodeHimself, setUserChosePinCodeHimself] = useState(false);

  const [connectedDevice, setConnectedDevice] = useState<Device>();

  const [onboardingDone, setOnboardingDone] = useState(false);
  const handleStartPostOnboarding = useStartPostOnboardingCallback();

  const [helpPinCode, setHelpPinCode] = useState(false);
  const [helpRecoveryPhrase, setHelpRecoveryPhrase] = useState(false);
  const [helpHideRecoveryPhrase, setHelpHideRecoveryPhrase] = useState(false);
  const [helpRecoveryPhraseWarning, setHelpRecoveryPhraseWarning] = useState(false);

  const urlSplit = useMemo(() => pathname.split("/"), [pathname]);
  const currentStep = useMemo(() => urlSplit[urlSplit.length - 1], [urlSplit]);
  const path = useMemo(() => urlSplit.slice(0, urlSplit.length - 1).join("/"), [urlSplit]);

  const dispatch = useDispatch();

  // Keep the state coming from react-router in a local state
  // as location.state will be undefined when navigating to other steps
  const [fromRecover, setFromRecover] = useState(false);
  useEffect(() => {
    if (history.location.state) {
      setFromRecover(history.location.state.fromRecover);
    }
  }, [history.location.state]);

  const screens = useMemo<IScreen[]>(
    () => [
      {
        id: ScreenId.howToGetStarted,
        component: HowToGetStarted,
        useCases: [UseCase.setupDevice],
        next: () => {
          track("Onboarding - Get started step 1");
          history.push(`${path}/${ScreenId.deviceHowTo}`);
        },
        previous: () => history.push("/onboarding/select-use-case"),
      },
      {
        id: ScreenId.deviceHowTo,
        component: DeviceHowTo,
        useCases: [UseCase.setupDevice],
        next: () => history.push(`${path}/${ScreenId.pinCode}`),
        previous: () => history.push(`${path}/${ScreenId.howToGetStarted}`),
      },
      {
        id: ScreenId.deviceHowTo2,
        component: DeviceHowTo2,
        useCases: [UseCase.setupDevice, UseCase.recoveryPhrase],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            history.push(`${path}/${ScreenId.deviceHowTo2}`);
          }
          // useCase === UseCase.recoveryPhrase
          else {
            history.push(`${path}/${ScreenId.pinCode}`);
          }
        },
        previous: () => {
          if (useCase === UseCase.setupDevice) {
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
        useCases: [UseCase.setupDevice, UseCase.recoveryPhrase, UseCase.recover],
        canContinue: userChosePinCodeHimself,
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Pin code step 1");
          }
          history.push(`${path}/${ScreenId.pinCodeHowTo}`);
        },
        previous: () => {
          if (useCase === UseCase.setupDevice) {
            history.push(`${path}/${ScreenId.deviceHowTo}`);
          } else if (useCase === UseCase.recover) {
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
        component: useCase === UseCase.recover ? RecoverPinCodeHowTo : PinCodeHowTo,
        useCases: [UseCase.setupDevice, UseCase.recoveryPhrase, UseCase.recover],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Pin code step 2");
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
        useCases: [UseCase.setupDevice],
        canContinue: userUnderstandConsequences,
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Recovery step 1");
          }
          history.push(`${path}/${ScreenId.useRecoverySheet}`);
        },
        previous: () => history.push(`${path}/${ScreenId.pinCodeHowTo}`),
      },
      {
        id: ScreenId.useRecoverySheet,
        component: UseRecoverySheet,
        useCases: [UseCase.setupDevice],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Recovery step 2");
          }
          history.push(`${path}/${ScreenId.recoveryHowTo3}`);
        },
        previous: () => history.push(`${path}/${ScreenId.newRecoveryPhrase}`),
      },
      {
        id: ScreenId.recoveryHowTo,
        component: RecoveryHowTo1,
        useCases: [UseCase.recoveryPhrase],
        next: () => history.push(`${path}/${ScreenId.recoveryHowTo2}`),
        previous: () => history.push(`${path}/${ScreenId.existingRecoveryPhrase}`),
      },
      {
        id: ScreenId.recoveryHowTo2,
        component: RecoveryHowTo2,
        useCases: [UseCase.recoveryPhrase],
        next: () => {
          setHelpRecoveryPhrase(true);
        },
        previous: () => history.push(`${path}/${ScreenId.recoveryHowTo}`),
      },
      {
        id: ScreenId.recoveryHowTo3,
        component: RecoveryHowTo3,
        useCases: [UseCase.setupDevice],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Recovery step 3");
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
            track("Onboarding - Recovery step 4 - HELP CLICK");
            setHelpHideRecoveryPhrase(true);
          },
        },
        useCases: [UseCase.setupDevice],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Recovery step 4");
          }
          setHelpHideRecoveryPhrase(true);
        },
        previous: () => history.push(`${path}/${ScreenId.recoveryHowTo3}`),
      },
      {
        id: ScreenId.importYourRecoveryPhrase,
        component: ImportYourRecoveryPhrase,
        useCases: [UseCase.setupDevice, UseCase.recoveryPhrase],
        next: () => history.push(`${path}/${ScreenId.deviceHowTo2}`),
        previous: () => {
          if (useCase === UseCase.setupDevice) {
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
        useCases: [UseCase.recoveryPhrase],
        next: () => history.push(`${path}/${ScreenId.recoveryHowTo}`),
        previous: () => history.push(`${path}/${ScreenId.pinCodeHowTo}`),
        canContinue: userUnderstandConsequences,
      },
      {
        id: ScreenId.quizSuccess,
        component: QuizSuccess,
        useCases: [UseCase.setupDevice],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Pair start");
          }
          history.push(`${path}/${ScreenId.pairMyNano}`);
        },
        previous: () => history.push(`${path}/${ScreenId.hideRecoveryPhrase}`),
      },
      {
        id: ScreenId.quizFailure,
        component: QuizFailure,
        useCases: [UseCase.setupDevice],
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Pair start");
          }
          history.push(`${path}/${ScreenId.pairMyNano}`);
        },
        previous: () => history.push(`${path}/${ScreenId.hideRecoveryPhrase}`),
      },
      {
        id: ScreenId.pairMyNano,
        component: PairMyNano,
        next: () => {
          if (useCase === UseCase.setupDevice) {
            track("Onboarding - Genuine Check");
          }
          if (useCase === UseCase.recover) {
            history.push(`${path}/${ScreenId.recoverHowTo}`);
            return;
          }
          history.push(`${path}/${ScreenId.genuineCheck}`);
        },
        previous: () => {
          if (useCase === UseCase.recover && fromRecover) {
            history.push(recoverDiscoverPath);
          } else if (useCase === UseCase.connectDevice || useCase === UseCase.recover) {
            history.push("/onboarding/select-use-case");
          } else if (useCase === UseCase.setupDevice) {
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
          dispatch(
            saveSettings({
              hasCompletedOnboarding: true,
            }),
          );
          track("Onboarding - End");
          setOnboardingDone(true);
        },
        previous: () => history.push(`${path}/${ScreenId.pairMyNano}`),
      },
      {
        id: ScreenId.recoverHowTo,
        component: RecoverHowTo,
        useCases: [UseCase.recover],
        next: () => {
          // TODO in next ticket
          history.push(`${path}/${ScreenId.pinCode}`);
        },
        previous: () =>
          fromRecover
            ? history.push(recoverDiscoverPath)
            : history.push("/onboarding/select-use-case"),
      },
    ],
    [
      userChosePinCodeHimself,
      useCase,
      userUnderstandConsequences,
      connectedDevice,
      history,
      path,
      fromRecover,
      recoverDiscoverPath,
      dispatch,
    ],
  );

  useEffect(() => {
    if (onboardingDone && connectedDevice) {
      /**
       * There is a lag if we call history.push("/") directly.
       * To improve the UX in that situation, we have to first commit a "loading"
       * state and then when that state is rendered (which will be when this
       * block is executed), on the following commit we can call
       * history.push("/").
       */
      const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
        if (history.location.pathname !== "/")
          handleStartPostOnboarding({
            deviceModelId: connectedDevice.modelId,
            fallbackIfNoAction: () => history.push("/"),
          });

        if (isRecoverDisplayed(recoverFF, connectedDevice?.modelId)) {
          if (useCase === UseCase.setupDevice && upsellPath) {
            history.push(upsellPath);
          } else if (useCase === UseCase.recoveryPhrase && restore24Path) {
            history.push(restore24Path);
          } else if (useCase === UseCase.connectDevice && devicePairingPath) {
            history.push(devicePairingPath);
          }
        }
      }, 0);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    connectedDevice,
    devicePairingPath,
    handleStartPostOnboarding,
    history,
    onboardingDone,
    restore24Path,
    upsellPath,
    useCase,
    recoverFF,
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

    if (useCase === UseCase.recoveryPhrase) {
      // Remove step : hideRecoveryPhrase
      stepList.splice(3, 1);
    }

    return stepList;
  }, [useCase]);

  const currentScreenIndex = useMemo(
    () => screens.findIndex(s => s.id === currentStep),
    [currentStep, screens],
  );
  const {
    component,
    canContinue,
    next,
    previous,
    id: currentScreenId,
  } = screens[currentScreenIndex];
  const CurrentScreen = component as unknown as {
    Illustration: JSX.Element;
    Footer: React.ElementType;
    continueLabel: string;
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

  const handleNextPin = useCallback(() => {
    let targetPath: string | object = `${path}/${ScreenId.existingRecoveryPhrase}`;

    if (useCase === UseCase.recover && recoverRestorePath) {
      const [pathname, search] = recoverRestorePath.split("?");
      targetPath = {
        pathname,
        search: search ? `?${search}` : undefined,
        state: { deviceId: connectedDevice?.deviceId },
      };
      dispatch(saveSettings({ hasCompletedOnboarding: true }));
    }

    if (useCase === UseCase.setupDevice) {
      targetPath = `${path}/${ScreenId.newRecoveryPhrase}`;
    }

    handleNextInDrawer(setHelpPinCode, targetPath);
  }, [connectedDevice?.deviceId, dispatch, handleNextInDrawer, path, recoverRestorePath, useCase]);

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
                useCase === UseCase.setupDevice
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

      <FlowStepper
        illustration={CurrentScreen.Illustration}
        AsideFooter={CurrentScreen.Footer}
        continueDisabled={canContinue === false}
        ProgressBar={
          useCase !== UseCase.connectDevice && useCase !== UseCase.recover ? (
            <ProgressBar steps={progressSteps} currentIndex={screenStepIndex} />
          ) : (
            <></>
          )
        }
        continueLabel={CurrentScreen.continueLabel}
        continueLoading={onboardingDone}
        handleContinue={next}
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
