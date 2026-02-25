import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { track } from "~/analytics";
import { BuyDeviceNavigatorParamList } from "~/components/RootNavigator/types/BuyDeviceNavigator";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "~/const";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";

type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<BuyDeviceNavigatorParamList, ScreenName.GetDevice>
  | StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.GetDevice>
>;

const useUpsellFlexModel = () => {
  const navigation = useNavigation<NavigationProp>();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const handleBack = useCallback(() => {
    navigation.goBack();
    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "close",
        page: "Upsell Flex",
      });
    }
  }, [readOnlyModeEnabled, navigation]);

  return {
    handleBack,
    readOnlyModeEnabled,
  };
};

export default useUpsellFlexModel;
