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
import { NavigatorName, ScreenName } from "~/const";
import { setOnboardingType } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { OnboardingType } from "~/reducers/types";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { useCompleteSeededOnboarding } from "../../hooks/useCompleteSeededOnboarding";
import { resetToPortfolio } from "../../utils/exitActions";
import type { SyncOfferScreenProps } from "./useSyncOfferScreenViewModel";

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
  const learnMoreLink = useFeature("llmWalletSync")?.params?.learnMoreLink;

  useEffect(
    () =>
      navigation.addListener("beforeRemove", event => {
        if (!allowLeave.current) event.preventDefault();
      }),
    [navigation],
  );

  useEffect(() => {
    if (!handoverStarted || !hasTrustchain || completedOnSync.current) return;
    completedOnSync.current = true;
    allowLeave.current = true;
    complete();
    resetToPortfolio(navigation);
  }, [complete, handoverStarted, hasTrustchain, navigation]);

  const leaveToPortfolio = useCallback(() => {
    complete();
    allowLeave.current = true;
    resetToPortfolio(navigation);
  }, [complete, navigation]);

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
    if (learnMoreLink) Linking.openURL(learnMoreLink);
  }, [learnMoreLink]);

  return {
    onActivate,
    onSkip: leaveToPortfolio,
    onQuit: leaveToPortfolio,
    onLearnMore,
  };
}
