import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "~/context/hooks";
import { setFromLedgerSyncOnboarding, setIsPostOnboardingFlow } from "~/actions/settings";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { NavigatorName } from "~/const";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import {
  isFromLedgerSyncOnboardingSelector,
  isPostOnboardingFlowSelector,
  onboardingTypeSelector,
} from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";

export function useClose() {
  const navigationOnbarding =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const isFromLedgerSyncOnboarding = useSelector(isFromLedgerSyncOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const isPostOnboardingFlow = useSelector(isPostOnboardingFlowSelector);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const dispatch = useDispatch();

  const close = () => {
    if (isFromLedgerSyncOnboarding) {
      dispatch(setFromLedgerSyncOnboarding(false));

      if (onboardingType === OnboardingType.setupNew) {
        navigationOnbarding.popToTop();
        navigationOnbarding.goBack();
        return;
      }
    }

    if (isPostOnboardingFlow) {
      dispatch(setIsPostOnboardingFlow(false));
      navigateToPostOnboardingHub(true);
    } else {
      navigationOnbarding.replace(NavigatorName.Base, {
        screen: NavigatorName.Main,
      });
    }
  };

  return close;
}
