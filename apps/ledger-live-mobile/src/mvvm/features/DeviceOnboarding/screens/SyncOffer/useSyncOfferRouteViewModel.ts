import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useFeature } from "@features/platform-feature-flags";
import { useCompleteSeededOnboarding } from "LLM/features/DeviceOnboarding/hooks/useCompleteSeededOnboarding";
import { closeOnboarding } from "LLM/features/DeviceOnboarding/utils/exitActions";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { NavigatorName, ScreenName } from "~/const";
import { setOnboardingType } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { OnboardingType } from "~/reducers/types";
import type { DeviceOnboardingNavigatorParamList } from "LLM/features/DeviceOnboarding/navigation/types";
import { useActivationDeviceIntentStep } from "LLM/features/WalletSync/screens/Activation/useActivationDeviceIntentStep";
import type { SyncOfferPhase, SyncOfferScreenProps } from "./useSyncOfferScreenViewModel";

const DEFAULT_WATCH_INITIAL_TIMEOUT_MS = 1000;
const VISUAL_PENDING_TIMEOUT_MS = 1000;
const WATCH_LOOP_SLACK_MS = 500;

export function syncOfferSettleDelay(initialTimeout: number): number {
  return initialTimeout + VISUAL_PENDING_TIMEOUT_MS + WATCH_LOOP_SLACK_MS;
}

const LEDGER_SYNC_LEARN_MORE_URL =
  "https://www.ledger.com/academy/topics/ledgersolutions/ledger-sync-effortlessly-sync-your-accounts-in-ledger-live-safely-securely-and-with-complete-privacy";

type OfferRoute = RouteProp<
  DeviceOnboardingNavigatorParamList,
  ScreenName.DeviceOnboardingSyncOffer
>;

type SyncOfferRouteViewModel = SyncOfferScreenProps &
  Readonly<{ deviceIntentStepElement: React.ReactElement | null }>;

export function useSyncOfferRouteViewModel(): SyncOfferRouteViewModel {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const { device, wasReadOnlyAtEntry } = useRoute<OfferRoute>().params;
  const hasTrustchain = Boolean(useSelector(trustchainSelector)?.rootId);
  const { visualPending } = useWalletSyncUserState();
  const featureWalletSync = useFeature("llmWalletSync");
  const initialTimeout =
    featureWalletSync?.params?.watchConfig?.initialTimeout || DEFAULT_WATCH_INITIAL_TIMEOUT_MS;
  const [handoverStarted, setHandoverStarted] = useState(false);
  const [watchLoopSettled, setWatchLoopSettled] = useState(false);
  const completedOnSync = useRef(false);
  const initialSyncDone = useRef(false);
  const allowLeave = useRef(false);
  const complete = useCompleteSeededOnboarding(wasReadOnlyAtEntry);
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const deviceIntentStep = useActivationDeviceIntentStep();
  const { isEnabled: isDeviceIntentStepEnabled, start: startDeviceIntentStep } = deviceIntentStep;
  const learnMoreUrl = useLocalizedUrl(LEDGER_SYNC_LEARN_MORE_URL);
  const awaitingSync = handoverStarted && hasTrustchain;
  if (awaitingSync && watchLoopSettled && !visualPending) {
    initialSyncDone.current = true;
  }
  const phase: SyncOfferPhase = syncOfferPhase(awaitingSync, initialSyncDone.current);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", event => {
        if (!allowLeave.current) event.preventDefault();
      }),
    [navigation],
  );

  useEffect(() => {
    if (!awaitingSync) return;
    const timeout = setTimeout(
      () => setWatchLoopSettled(true),
      syncOfferSettleDelay(initialTimeout),
    );
    return () => clearTimeout(timeout);
  }, [awaitingSync, initialTimeout]);

  const finishOnboarding = useCallback(() => {
    if (completedOnSync.current) return;
    completedOnSync.current = true;
    allowLeave.current = true;
    complete();
    notifyFlowCompleted("onboarding");
    closeOnboarding(navigation);
  }, [complete, navigation, notifyFlowCompleted]);

  const onActivate = useCallback(() => {
    setHandoverStarted(true);
    // Ledger Sync only creates a trustchain for a new setup or a completed onboarding.
    dispatch(setOnboardingType(OnboardingType.setupNew));
    if (isDeviceIntentStepEnabled) {
      startDeviceIntentStep({ seededOffer: true });
      return;
    }
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: { device, seededOffer: true },
    });
  }, [device, dispatch, isDeviceIntentStepEnabled, navigation, startDeviceIntentStep]);

  const onSkip = finishOnboarding;

  const onLearnMore = useCallback(() => {
    Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return {
    onActivate,
    onSkip,
    onQuit: finishOnboarding,
    onLearnMore,
    onContinue: finishOnboarding,
    phase,
    deviceIntentStepElement: deviceIntentStep.element,
  };
}

function syncOfferPhase(awaitingSync: boolean, initialSyncDone: boolean): SyncOfferPhase {
  if (!awaitingSync) return "offer";
  if (initialSyncDone) return "success";
  return "synchronizing";
}
