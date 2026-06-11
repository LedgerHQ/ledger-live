import { useCallback } from "react";
import { NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import { useDispatch } from "~/context/hooks";
import {
  completeOnboarding,
  setIsReborn,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { NavigatorName } from "~/const";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";

type CompleteLazyOnboardingParams = {
  triggerNotificationsPrompt?: () => void;
  initialBaseScreen?: NavigatorScreenParams<BaseNavigatorStackParamList>;
};

export function useCompleteLazyOnboarding() {
  const dispatch = useDispatch();
  const navigation =
    useNavigation<
      RootNavigationComposite<StackNavigatorNavigation<OnboardingNavigatorParamList>>
    >();

  return useCallback(
    ({ triggerNotificationsPrompt, initialBaseScreen }: CompleteLazyOnboardingParams = {}) => {
      dispatch(completeOnboarding());
      dispatch(setOnboardingHasDevice(false));
      dispatch(setReadOnlyMode(true));
      dispatch(setIsReborn(true));

      navigation.navigate(
        NavigatorName.Base,
        initialBaseScreen ?? {
          screen: NavigatorName.Main,
          params: {
            screen: NavigatorName.Portfolio,
            params: {
              screen: NavigatorName.WalletTab,
            },
          },
        },
      );

      triggerNotificationsPrompt?.();
    },
    [dispatch, navigation],
  );
}
