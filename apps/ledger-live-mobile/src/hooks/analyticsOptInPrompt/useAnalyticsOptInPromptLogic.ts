import { useSelector, useDispatch } from "~/context/hooks";
import {
  completeOnboarding,
  setHasSeenAnalyticsOptInPrompt,
  setIsReborn,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
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
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useNotifications } from "LLM/features/NotificationsPrompt";

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
  const walletFeaturesConfig = useWalletFeaturesConfig("mobile");
  const shouldUseLazyOnboarding =
    (walletFeaturesConfig as typeof walletFeaturesConfig & { shouldUseLazyOnboarding?: boolean })
      .shouldUseLazyOnboarding ?? false;
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();
  const flow = trackingKeysByFlow?.[entryPoint];

  const privacyPolicyUrl =
    (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en;

  const trackingPolicyUrl =
    (urls.trackingPolicy as Record<string, string>)[locale] || urls.trackingPolicy.en;

  const urlByVariant = {
    [ABTestingVariants.variantA]: trackingPolicyUrl,
    [ABTestingVariants.variantB]: privacyPolicyUrl,
  };

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
        if (shouldUseLazyOnboarding) {
          dispatch(completeOnboarding());
          dispatch(setReadOnlyMode(true));
          dispatch(setIsReborn(true));
          dispatch(setOnboardingHasDevice(false));
          navigation.navigate(NavigatorName.Base, {
            screen: NavigatorName.Main,
            params: {
              screen: NavigatorName.Portfolio,
              params: {
                screen: NavigatorName.WalletTab,
              },
            },
          });
          tryTriggerPushNotificationDrawerAfterAction("onboarding");
        } else {
          navigation.navigate(NavigatorName.BaseOnboarding, {
            screen: NavigatorName.Onboarding,
            params: {
              screen: ScreenName.OnboardingPostWelcomeSelection,
              params: {
                userHasDevice: true,
              },
            },
          });
        }
        break;
    }
    updateIdentify(undefined, shouldWeTrack);
  };

  const clickOnLearnMore = () => {
    Linking.openURL(urlByVariant[variant]);
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
