import { useNavigation } from "@react-navigation/core";
import { useDispatch } from "react-redux";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useCallback, useEffect } from "react";
import { setHasOrderedNano, setSensitiveAnalytics } from "~/actions/settings";

type NavigationProp = RootNavigationComposite<
  StackNavigatorNavigation<BaseNavigatorStackParamList, ScreenName.PostBuyDeviceScreen>
>;

const usePostBuySuccessModel = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();

  const onClose = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [navigation]);

  useEffect(() => {
    dispatch(setHasOrderedNano(true));
    dispatch(setSensitiveAnalytics(true));
  }, [dispatch]);

  return {
    onClose,
  };
};

export default usePostBuySuccessModel;
