import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { openPostOnboardingHubDrawer } from "~/reducers/postOnboardingHubDrawer";

const mainPortfolioWalletTabParams = {
  screen: NavigatorName.Portfolio,
  params: { screen: NavigatorName.WalletTab },
} as const;

export function useNavigateToPostOnboardingHubCallback() {
  const navigation = useNavigation<RootNavigation>();
  const dispatch = useDispatch();
  const onboardingWidgetFeature = useFeature("onboardingWidget");
  const shouldDisplayOnboardingWidget = onboardingWidgetFeature?.enabled ?? false;

  return useCallback(
    (resetNavigationStack?: boolean) => {
      if (shouldDisplayOnboardingWidget) {
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
                      params: mainPortfolioWalletTabParams,
                    },
                  ],
                },
              },
            ],
          });
        } else {
          navigation.navigate(NavigatorName.Base, {
            screen: NavigatorName.Main,
            params: mainPortfolioWalletTabParams,
          });
        }
        dispatch(openPostOnboardingHubDrawer());
        return;
      }

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
    [dispatch, navigation, shouldDisplayOnboardingWidget],
  );
}
