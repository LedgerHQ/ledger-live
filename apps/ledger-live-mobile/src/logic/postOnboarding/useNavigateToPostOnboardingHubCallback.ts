import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { NavigatorName, ScreenName } from "../../const";

export function useNavigateToPostOnboardingHubCallback() {
  const navigation = useNavigation();
  return useCallback(() => {
    navigation.navigate(NavigatorName.PostOnboarding, {
      screen: ScreenName.PostOnboardingHub,
    });
  }, [navigation]);
}
