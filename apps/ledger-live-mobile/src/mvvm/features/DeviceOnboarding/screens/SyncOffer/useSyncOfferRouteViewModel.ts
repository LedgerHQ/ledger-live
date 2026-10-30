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
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { NavigatorName, ScreenName } from "~/const";
import { setOnboardingType } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { OnboardingType } from "~/reducers/types";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { seededPages, trackSeededDone, trackSeededPage } from "../../analytics/seededTracking";
import { useCompleteSeededOnboarding } from "../../hooks/useCompleteSeededOnboarding";
import { closeOnboarding } from "../../utils/exitActions";
import type { SyncOfferScreenProps } from "./useSyncOfferScreenViewModel";

const LEDGER_SYNC_LEARN_MORE_URL =
  "https://www.ledger.com/academy/topics/ledgersolutions/ledger-sync-effortlessly-sync-your-accounts-in-ledger-live-safely-securely-and-with-complete-privacy";

type OfferRoute = RouteProp<OnboardingNavigatorParamList, ScreenName.DeviceOnboardingSyncOffer>;

export function useSyncOfferRouteViewModel(): SyncOfferScreenProps {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const { device, wasReadOnlyAtEntry, seededOutcome } = useRoute<OfferRoute>().params;
  const hasTrustchain = Boolean(useSelector(trustchainSelector)?.rootId);
  const [handoverStarted, setHandoverStarted] = useState(false);
  const completedOnSync = useRef(false);
  const allowLeave = useRef(false);
  const complete = useCompleteSeededOnboarding(wasReadOnlyAtEntry);
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const learnMoreUrl = useLocalizedUrl(LEDGER_SYNC_LEARN_MORE_URL);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", event => {
        if (!allowLeave.current) event.preventDefault();
      }),
    [navigation],
  );

  const finishOnboarding = useCallback(
    (syncDone: boolean) => {
      if (completedOnSync.current) return;
      completedOnSync.current = true;
      allowLeave.current = true;
      if (seededOutcome) {
        if (syncDone) trackSeededPage(seededPages.ledgerSyncSuccess, seededOutcome.deviceType);
        trackSeededDone(seededOutcome, syncDone);
      }
      complete();
      notifyFlowCompleted("onboarding");
      closeOnboarding(navigation);
    },
    [complete, navigation, notifyFlowCompleted, seededOutcome],
  );

  useEffect(() => {
    if (!handoverStarted || !hasTrustchain) return;
    finishOnboarding(true);
  }, [finishOnboarding, handoverStarted, hasTrustchain]);

  const finishWithoutSync = useCallback(() => {
    finishOnboarding(false);
  }, [finishOnboarding]);

  const onActivate = useCallback(() => {
    setHandoverStarted(true);
    // Ledger Sync only creates a trustchain for a new setup or a completed onboarding.
    dispatch(setOnboardingType(OnboardingType.setupNew));
    navigation.getParent()?.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: { device },
    });
  }, [device, dispatch, navigation]);

  const onLearnMore = useCallback(() => {
    Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return {
    onActivate,
    onSkip: finishWithoutSync,
    onQuit: finishWithoutSync,
    onLearnMore,
    seededDeviceType: seededOutcome?.deviceType ?? null,
  };
}
