import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { getDeviceModel } from "@ledgerhq/devices";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { SeedOriginType } from "@ledgerhq/types-live";
import { useSelector, useDispatch } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import useTwoStepDesync from "../../hooks/useTwoStepDesync";
import {
  completeOnboarding,
  setHasOrderedNano,
  setIsOnboardingFlow,
  setIsOnboardingFlowReceiveSuccess,
  setReadOnlyMode,
} from "~/actions/settings";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { COMPANION_STATE, CompanionStep, SEED_STATE } from "../../types";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { isOnboardingFlowReceiveSuccessSelector } from "~/reducers/settings";
import type { TwoStepSyncOnboardingCompanionProps } from "./types";

const READY_REDIRECT_DELAY_MS = 2500;

export const useTwoStepSyncOnboardingCompanionViewModel = ({
  navigation,
  device,
  updateHeaderOverlayDelay,
  onShouldHeaderBeOverlaid,
  onLostDevice,
  notifyEarlySecurityCheckShouldReset,
}: TwoStepSyncOnboardingCompanionProps) => {
  const baseNavigation = useNavigation<RootNavigation>();
  const dispatchRedux = useDispatch();
  const isOnboardingFlowReceiveSuccess = useSelector(isOnboardingFlowReceiveSuccessSelector);

  const [companionStep, setCompanionStep] = useState<CompanionStep>(COMPANION_STATE.SETUP);
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);
  const [isInitialised, setIsInitialised] = useState<boolean>(false);

  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preventNavigation = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const analyticsSeedConfiguration = useRef<SeedOriginType | undefined>(undefined);

  const isFocused = useIsFocused();
  useKeepScreenAwake(isFocused);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "sync-onboarding-companion",
    navigationOverride: baseNavigation,
    fromMenu: true,
  });

  const twoStepDesync = useTwoStepDesync({
    onLostDevice,
    onShouldHeaderBeOverlaid,
    updateHeaderOverlayDelay,
    setIsPollingOn,
  });

  const handleOnboardingDoneState = useCallback(() => {
    dispatchRedux(setReadOnlyMode(false));
    dispatchRedux(setHasOrderedNano(false));
    dispatchRedux(completeOnboarding());
  }, [dispatchRedux]);

  const handleOnboardingDone = useCallback(() => {
    handleOnboardingDoneState();
    navigation.navigate(ScreenName.SyncOnboardingCompletion, {
      device,
      seedConfiguration: analyticsSeedConfiguration.current,
    });
  }, [device, navigation, handleOnboardingDoneState]);

  const handleReceiveFlowSuccess = useCallback(() => {
    dispatchRedux(setIsOnboardingFlowReceiveSuccess(false));
    handleOnboardingDoneState();
    baseNavigation.reset({
      index: 0,
      routes: [
        {
          name: NavigatorName.BaseOnboarding,
          state: {
            routes: [
              {
                name: NavigatorName.SyncOnboarding,
                state: {
                  routes: [
                    {
                      name: ScreenName.SyncOnboardingCompletion,
                      params: {
                        device,
                        seedConfiguration: analyticsSeedConfiguration.current,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  }, [dispatchRedux, baseNavigation, device, handleOnboardingDoneState]);

  const handleSecondStepFinish = useCallback(
    (done: boolean) => {
      if (!done) {
        handleOnboardingDone();
      } else if (companionStep === SEED_STATE.NEW_SEED) {
        dispatchRedux(setIsOnboardingFlow(true));
        handleOpenReceiveDrawer();
      } else {
        setCompanionStep(COMPANION_STATE.EXIT);
      }
    },
    [companionStep, handleOnboardingDone, dispatchRedux, handleOpenReceiveDrawer],
  );

  const handleFinishFirstStep = useCallback((nextStep: SEED_STATE) => {
    setCompanionStep(nextStep);
  }, []);

  useEffect(() => {
    navigation.addListener("beforeRemove", e => {
      if (preventNavigation.current) e.preventDefault();
    });
  }, [navigation]);

  useEffect(() => {
    if (companionStep === COMPANION_STATE.EXIT) {
      preventNavigation.current = true;
      readyRedirectTimerRef.current = setTimeout(() => {
        preventNavigation.current = false;
        handleOnboardingDone();
      }, READY_REDIRECT_DELAY_MS);
    }

    return () => {
      if (readyRedirectTimerRef.current) {
        preventNavigation.current = false;
        clearTimeout(readyRedirectTimerRef.current);
        readyRedirectTimerRef.current = null;
      }
    };
  }, [companionStep, handleOnboardingDone]);

  useEffect(() => {
    if (!isInitialised) {
      if (isOnboardingFlowReceiveSuccess) dispatchRedux(setIsOnboardingFlowReceiveSuccess(false));
      setIsInitialised(true);
    } else if (isOnboardingFlowReceiveSuccess) {
      handleReceiveFlowSuccess();
    }
  }, [isOnboardingFlowReceiveSuccess, handleReceiveFlowSuccess, dispatchRedux, isInitialised]);

  return {
    device,
    navigation,
    productName,
    companionStep,
    isPollingOn,
    setIsPollingOn,
    scrollViewRef,
    analyticsSeedConfiguration,
    notifyEarlySecurityCheckShouldReset,
    onLostDevice,
    twoStepDesync,
    handleFinishFirstStep,
    handleSecondStepFinish,
  };
};

export type TwoStepSyncOnboardingCompanionViewProps = ReturnType<
  typeof useTwoStepSyncOnboardingCompanionViewModel
>;
