import { useCallback } from "react";
import { NavigationProp, NavigationState, ParamListBase } from "@react-navigation/native";
import { SwapWebviewAllowedPageNames } from "~/components/Web3AppWebview/types";
import { useIsSwapTab } from "./useIsSwapTab";

type NavigationType = Omit<NavigationProp<ParamListBase>, "getState"> & {
  getState(): NavigationState | undefined;
};

interface NavigationEvent {
  url: string;
  canGoBack: boolean;
}

export function useSwapNavigationHelper({ navigation }: { navigation: NavigationType }) {
  const { isSwapTabScreen } = useIsSwapTab();

  return useCallback(
    ({ url: urlFromEvent, canGoBack: canGoBackFromEvent }: NavigationEvent) => {
      if (isSwapTabScreen && urlFromEvent !== "") {
        const url = new URL(urlFromEvent);
        const tabParam = url.searchParams.get("tab");

        let page: SwapWebviewAllowedPageNames =
          tabParam === "QUOTES_LIST"
            ? SwapWebviewAllowedPageNames.QuotesList
            : SwapWebviewAllowedPageNames.AccountSelection;

        let canGoBack = canGoBackFromEvent;

        if (urlFromEvent.includes("two-step-approval")) {
          page = SwapWebviewAllowedPageNames.TwoStepApproval;
        }

        if (urlFromEvent.includes("unknown-error")) {
          page = SwapWebviewAllowedPageNames.UnknownError;
          canGoBack = false;
        }

        if (urlFromEvent.includes("quotes")) {
          page = SwapWebviewAllowedPageNames.QuotesList;
          canGoBack = true;
        }

        navigation.setParams({ swapNavigationParams: { tab: tabParam, page: page, canGoBack } });
      }
    },
    [isSwapTabScreen, navigation],
  );
}
