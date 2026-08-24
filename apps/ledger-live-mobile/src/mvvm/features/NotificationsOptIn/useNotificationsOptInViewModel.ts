import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  useNotificationsData,
  useNotificationsPrompt,
  useNotificationsPromptEligibility,
  type NotificationsPromptRepromptDelay,
} from "LLM/features/NotificationsPrompt";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useCompleteLazyOnboarding } from "./hooks/useCompleteLazyOnboarding";

export type NotificationsOptInState = "default" | "error";

export type NotificationsOptInViewModel = {
  state: NotificationsOptInState;
  onBack: () => void;
  onAllowNotifications: () => Promise<void>;
  onMaybeLater: () => void;
  onContinue: () => void;
  isAllowNotificationsDisabled: boolean;
  dismissedCount: number;
  nextRepromptDelay: NotificationsPromptRepromptDelay | null;
};

export function useNotificationsOptInViewModel(): NotificationsOptInViewModel {
  const navigation =
    useNavigation<
      RootNavigationComposite<StackNavigatorNavigation<OnboardingNavigatorParamList>>
    >();
  const completeLazyOnboarding = useCompleteLazyOnboarding();
  const { initPushNotificationsData } = useNotificationsPrompt();
  const { permissionStatus, requestPushNotificationsPermission } = useNotificationsPermission();
  const { notifications, pushNotificationsDataOfUser, markUserAsOptIn, markUserAsOptOut } =
    useNotificationsData();
  const { nextRepromptDelay } = useNotificationsPromptEligibility({
    permissionStatus,
    areNotificationsAllowed: notifications.areNotificationsAllowed,
    transactionsAlertsCategory: notifications.transactionsAlertsCategory,
    pushNotificationsDataOfUser,
  });
  const [state, setState] = useState<NotificationsOptInState>("default");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dismissedCount = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0;

  useEffect(() => {
    let isMounted = true;

    initPushNotificationsData()
      .then(result => {
        if (!isMounted) return;

        setIsInitialized(true);

        if (result.status === "error") {
          setState("error");
          return;
        }

        if (
          result.osPermissionStatus === AuthorizationStatus.AUTHORIZED &&
          notifications.areNotificationsAllowed === true
        ) {
          completeLazyOnboarding();
          return;
        }

        setState("default");
      })
      .catch(() => {
        if (isMounted) {
          setIsInitialized(true);
          setState("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [completeLazyOnboarding, initPushNotificationsData, notifications.areNotificationsAllowed]);

  const trackButtonClicked = useCallback(
    (button: string) => {
      track("button_clicked", {
        button,
        page: "Drawer push notification opt-in",
        source: "onboarding",
        repromptDelay: nextRepromptDelay,
        dismissedCount,
      });
    },
    [dismissedCount, nextRepromptDelay],
  );

  const onMaybeLater = useCallback(() => {
    trackButtonClicked("maybe later");
    markUserAsOptOut();
    completeLazyOnboarding();
  }, [completeLazyOnboarding, markUserAsOptOut, trackButtonClicked]);

  const onAllowNotifications = useCallback(async () => {
    if (!isInitialized || isSubmitting) return;

    trackButtonClicked("allow notifications");
    setIsSubmitting(true);

    try {
      if (permissionStatus !== AuthorizationStatus.AUTHORIZED) {
        const permission = await requestPushNotificationsPermission();

        if (permission === AuthorizationStatus.DENIED) {
          trackButtonClicked("os_notifications_deny");
          markUserAsOptOut();
        } else if (permission === AuthorizationStatus.AUTHORIZED) {
          trackButtonClicked("os_notifications_allow");
          markUserAsOptIn();
        }
      }

      if (!notifications.areNotificationsAllowed) {
        completeLazyOnboarding({
          initialBaseScreen: {
            screen: NavigatorName.Settings,
            params: {
              screen: ScreenName.NotificationsSettings,
            },
          },
        });
        return;
      }

      completeLazyOnboarding();
    } catch {
      setState("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    completeLazyOnboarding,
    isInitialized,
    isSubmitting,
    markUserAsOptIn,
    markUserAsOptOut,
    notifications.areNotificationsAllowed,
    permissionStatus,
    requestPushNotificationsPermission,
    trackButtonClicked,
  ]);

  return useMemo(
    () => ({
      state,
      onBack: navigation.goBack,
      onAllowNotifications,
      onMaybeLater,
      onContinue: completeLazyOnboarding,
      isAllowNotificationsDisabled: !isInitialized || isSubmitting,
      dismissedCount,
      nextRepromptDelay,
    }),
    [
      dismissedCount,
      nextRepromptDelay,
      onAllowNotifications,
      onMaybeLater,
      completeLazyOnboarding,
      isInitialized,
      isSubmitting,
      navigation.goBack,
      state,
    ],
  );
}
