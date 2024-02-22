import { useDispatch, useSelector } from "react-redux";
import { setHasSeenAnalyticsOptInPrompt } from "~/actions/settings";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";
import { track, updateIdentify } from "~/analytics";
import { hasSeenAnalyticsOptInPromptSelector, trackingEnabledSelector } from "~/reducers/settings";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import { ABTestingVariants } from "@ledgerhq/types-live";

const trackingKeysByFlow: Record<EntryPoint, string> = {
  Onboarding: "consent onboarding",
  Portfolio: "consent existing users",
};

type Props = {
  entryPoint: EntryPoint;
  variant: ABTestingVariants;
};

const useAnalyticsOptInPromptLogic = ({ entryPoint, variant }: Props) => {
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const navigation =
    useNavigation<
      RootNavigationComposite<StackNavigatorNavigation<OnboardingNavigatorParamList>>
    >();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const shouldWeTrack = isTrackingEnabled || !hasSeenAnalyticsOptInPrompt;
  const flow = trackingKeysByFlow?.[entryPoint];

  const continueOnboarding = () => {
    dispatch(setHasSeenAnalyticsOptInPrompt(true));

    switch (entryPoint) {
      case "Portfolio":
        navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.Main,
          params: {
            screen: NavigatorName.Portfolio,
            params: {
              screen: NavigatorName.WalletTab,
            },
          },
        });
        break;
      case "Onboarding":
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.Onboarding,
          params: {
            screen: ScreenName.OnboardingPostWelcomeSelection,
            params: {
              userHasDevice: true,
            },
          },
        });
        break;
    }
    updateIdentify(undefined, shouldWeTrack);
  };

  const clickOnLearnMore = () => {
    Linking.openURL(
      (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en,
    );
    track(
      "button_clicked",
      {
        button: "Learn More",
        variant,
        flow,
      },
      shouldWeTrack,
    );
  };

  return {
    navigation,
    shouldWeTrack,
    continueOnboarding,
    clickOnLearnMore,
    flow,
  };
};

export default useAnalyticsOptInPromptLogic;
