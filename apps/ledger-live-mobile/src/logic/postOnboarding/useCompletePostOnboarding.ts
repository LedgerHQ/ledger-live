import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";

import { useNavigation } from "@react-navigation/native";
import { postOnboardingSetFinished } from "@ledgerhq/live-common/postOnboarding/actions";
import { NavigatorName } from "~/const";
import { useNotifications } from "LLM/features/NotificationsPrompt";

export type CompletePostOnboardingOptions = {
  readonly skipPortfolioNavigation?: boolean;
};

export function useCompletePostOnboarding() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();

  const closePostOnboarding = useCallback(
    (options?: CompletePostOnboardingOptions) => {
      tryTriggerPushNotificationDrawerAfterAction("onboarding");

      dispatch(postOnboardingSetFinished());

      if (!options?.skipPortfolioNavigation) {
        navigation.navigate(NavigatorName.Main, {
          screen: NavigatorName.Portfolio,
          params: { screen: NavigatorName.WalletTab },
        });
      }
    },
    [dispatch, navigation, tryTriggerPushNotificationDrawerAfterAction],
  );

  return closePostOnboarding;
}
