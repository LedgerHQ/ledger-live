import { ScreenName } from "~/const";
import { NavigationType } from ".";

export const swapRedirectToHistory = (navigation: NavigationType) => {
  return async () => {
    return navigation.navigate(ScreenName.SwapHistory);
  };
};
