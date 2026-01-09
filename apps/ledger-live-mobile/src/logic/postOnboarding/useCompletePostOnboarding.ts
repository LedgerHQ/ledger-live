import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";

import { useNavigation } from "@react-navigation/native";
import { postOnboardingSetFinished } from "@ledgerhq/live-common/postOnboarding/reducer";
import { NavigatorName } from "~/const";

export function useCompletePostOnboarding() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const closePostOnboarding = useCallback(() => {
    dispatch(postOnboardingSetFinished());

    navigation.navigate(NavigatorName.Main, {
      screen: NavigatorName.Portfolio,
      params: { screen: NavigatorName.WalletTab },
    });
  }, [dispatch, navigation]);

  return closePostOnboarding;
}
