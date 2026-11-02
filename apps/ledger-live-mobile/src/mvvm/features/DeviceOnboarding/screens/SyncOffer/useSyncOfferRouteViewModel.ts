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
import { useCompleteSeededOnboarding } from "../../hooks/useCompleteSeededOnboarding";
import { closeOnboarding } from "../../utils/exitActions";
import type { SyncOfferScreenProps } from "./useSyncOfferScreenViewModel";

const LEDGER_SYNC_LEARN_MORE_URL =
  "https://www.ledger.com/academy/topics/ledgersolutions/ledger-sync-effortlessly-sync-your-accounts-in-ledger-live-safely-securely-and-with-complete-privacy";

type OfferRoute = RouteProp<OnboardingNavigatorParamList, ScreenName.DeviceOnboardingSyncOffer>;

export function useSyncOfferRouteViewModel(): SyncOfferScreenProps {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const { device, wasReadOnlyAtEntry } = useRoute<OfferRoute>().params;
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

  const finishOnboarding = useCallback(() => {
    if (completedOnSync.current) return;
    completedOnSync.current = true;
    allowLeave.current = true;
    complete();
    notifyFlowCompleted("onboarding");
    closeOnboarding(navigation);
  }, [complete, navigation, notifyFlowCompleted]);

  useEffect(() => {
    if (!handoverStarted || !hasTrustchain) return;
    finishOnboarding();
  }, [finishOnboarding, handoverStarted, hasTrustchain]);

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
    onSkip: finishOnboarding,
    onQuit: finishOnboarding,
    onLearnMore,
  };
}
