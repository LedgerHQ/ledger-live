import { NavigationProp, NavigationState } from "@react-navigation/native";

export const swapRedirectToHistory = (
  _: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
    getState(): NavigationState | undefined;
  },
) => {
  return async () => {
    return Promise.resolve(undefined);
  };
};
