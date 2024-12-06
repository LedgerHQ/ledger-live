import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";

export function useNavigateToPostOnboardingHubCallback() {
  const navigation = useNavigation<RootNavigation>();
  return useCallback(
    (resetNavigationStack?: boolean) => {
      if (resetNavigationStack) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: NavigatorName.Base,
              state: {
                routes: [
                  {
                    name: NavigatorName.Main,
                  },
                  {
                    name: NavigatorName.PostOnboarding,
                    state: {
                      routes: [
                        {
                          name: ScreenName.PostOnboardingHub,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        });
      } else {
        navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.PostOnboarding,
          params: {
            screen: ScreenName.PostOnboardingHub,
          },
        });
      }
    },
    [navigation],
  );
}
