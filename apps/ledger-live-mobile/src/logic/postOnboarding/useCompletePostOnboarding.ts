import { useCallback, useRef } from "react";
import { useDispatch } from "react-redux";

import { useNavigation } from "@react-navigation/native";
import { postOnboardingSetFinished } from "@ledgerhq/live-common/postOnboarding/actions";
import { NavigatorName } from "../../const";

export function useCompletePostOnboarding() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const allowClosingScreen = useRef<boolean>(true);

  const closePostOnboarding = useCallback(() => {
    dispatch(postOnboardingSetFinished());
    allowClosingScreen.current = true;
    navigation.navigate(NavigatorName.Main);
  }, [dispatch, navigation]);

  return closePostOnboarding;
}
