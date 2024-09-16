import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { setFromLedgerSyncOnboarding } from "~/actions/settings";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { NavigatorName } from "~/const";
import { isFromLedgerSyncOnboardingSelector } from "~/reducers/settings";

export function useClose() {
  const navigationOnbarding =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const isFromLedgerSyncOnboarding = useSelector(isFromLedgerSyncOnboardingSelector);
  const dispatch = useDispatch();

  const close = () => {
    if (isFromLedgerSyncOnboarding) {
      dispatch(setFromLedgerSyncOnboarding(false));
    }
    navigationOnbarding.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  };

  return close;
}
