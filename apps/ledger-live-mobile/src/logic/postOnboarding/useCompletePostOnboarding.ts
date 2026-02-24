import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";

import { useNavigation } from "@react-navigation/native";
import { postOnboardingSetFinished } from "@ledgerhq/live-common/postOnboarding/actions";
import { NavigatorName } from "~/const";
import { useNotifications } from "LLM/features/NotificationsPrompt";

export function useCompletePostOnboarding() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();

  const closePostOnboarding = useCallback(() => {
    tryTriggerPushNotificationDrawerAfterAction("onboarding");

    dispatch(postOnboardingSetFinished());

    navigation.navigate(NavigatorName.Main, {
      screen: NavigatorName.Portfolio,
      params: { screen: NavigatorName.WalletTab },
    });
  }, [dispatch, navigation, tryTriggerPushNotificationDrawerAfterAction]);

  return closePostOnboarding;
}
