import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "~/context/store";
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
} from "~/reducers/settings";

export function useClose() {
  const navigationOnbarding =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const isFromLedgerSyncOnboarding = useSelector(isFromLedgerSyncOnboardingSelector);
  const isPostOnboardingFlow = useSelector(isPostOnboardingFlowSelector);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const dispatch = useDispatch();

  const close = () => {
    if (isFromLedgerSyncOnboarding) {
      dispatch(setFromLedgerSyncOnboarding(false));
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
