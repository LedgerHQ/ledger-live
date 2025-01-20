import {
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { SwapFormNavigatorParamList } from "~/components/RootNavigator/types/SwapFormNavigator";
import { ScreenName } from "~/const";

export const swapRedirectToHistory = (
  navigation: StackNavigatorNavigation<SwapFormNavigatorParamList>,
) => {
  return async () => {
    navigation.replace(ScreenName.SwapHistory);
    return Promise.resolve(undefined);
  };
};
