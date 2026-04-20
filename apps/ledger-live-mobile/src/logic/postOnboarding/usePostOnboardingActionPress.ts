import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { track } from "~/analytics";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { useCompleteActionCallback } from "~/logic/postOnboarding/useCompleteAction";
import { usePostOnboardingActionHandlers } from "~/logic/postOnboarding/usePostOnboardingActionHandlers";
import { usePostOnboardingHubCompletionContext } from "~/logic/postOnboarding/usePostOnboardingHubCompletionContext";
import { isPostOnboardingHubActionFulfilled } from "~/logic/postOnboarding/postOnboardingHubCompletion";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { PostOnboardingNavigatorParamList } from "~/components/RootNavigator/types/PostOnboardingNavigator";
import type { PostOnboardingActionRowProps } from "~/components/PostOnboarding/PostOnboardingActionRow.types";

export function usePostOnboardingActionPress(props: PostOnboardingActionRowProps) {
  const {
    id,
    completed,
    getIsAlreadyCompleted,
    getIsAlreadyCompletedByState,
    disabled,
    buttonLabelForAnalyticsEvent,
    deviceModelId,
    shouldCompleteOnStart,
    openActivationDrawer,
  } = props;

  const context = usePostOnboardingHubCompletionContext();
  const { protectId } = context;

  const navigation =
    useNavigation<
      BaseNavigationComposite<StackNavigatorNavigation<PostOnboardingNavigatorParamList>>
    >();
  const completeAction = useCompleteActionCallback();
  const customActionHandlers = usePostOnboardingActionHandlers();

  const [isActionCompleted, setIsActionCompleted] = useState(false);
  const [isCompletionLoading, setIsCompletionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsCompletionLoading(true);
    isPostOnboardingHubActionFulfilled(
      { completed, getIsAlreadyCompletedByState, getIsAlreadyCompleted },
      context,
    )
      .then(result => {
        if (cancelled) return;
        setIsActionCompleted(result);
        setIsCompletionLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsActionCompleted(false);
        setIsCompletionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [completed, getIsAlreadyCompletedByState, getIsAlreadyCompleted, context]);

  const handlePress = useCallback(() => {
    const customHandler = customActionHandlers[id];
    if (customHandler) {
      customHandler();
    } else if ("getNavigationParams" in props) {
      const navigationArgs = props.getNavigationParams({
        deviceModelId,
        protectId,
        referral: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
      });
      navigation.navigate(navigationArgs[0], navigationArgs[1]);
    } else if ("startAction" in props) {
      props.startAction?.({
        openActivationDrawer,
      });
    }

    if (buttonLabelForAnalyticsEvent) {
      track("button_clicked", {
        button: buttonLabelForAnalyticsEvent,
        deviceModelId,
        flow: "post-onboarding",
      });
    }

    if (shouldCompleteOnStart) completeAction(id);
  }, [
    customActionHandlers,
    id,
    props,
    deviceModelId,
    protectId,
    navigation,
    openActivationDrawer,
    buttonLabelForAnalyticsEvent,
    shouldCompleteOnStart,
    completeAction,
  ]);

  const isPressDisabled = disabled || isActionCompleted || isCompletionLoading;

  return {
    isActionCompleted,
    isCompletionLoading,
    handlePress,
    isPressDisabled,
  };
}
