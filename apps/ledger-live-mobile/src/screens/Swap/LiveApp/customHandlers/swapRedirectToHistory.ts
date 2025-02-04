import { NavigationProp, NavigationState } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

export const swapRedirectToHistory = (
  navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
      getState(): NavigationState | undefined;
    },
) => {
  return async () => {
    return Promise.resolve(undefined);
  };
};
