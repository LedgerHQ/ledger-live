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

        const isTwoStepFlow =
          urlFromEvent.includes("multi-step-transaction") ||
          urlFromEvent.includes("two-step-approval") ||
          urlFromEvent.includes("rfq-approval") ||
          urlFromEvent.includes("eth-app-flow");

        if (isTwoStepFlow) {
          page = SwapWebviewAllowedPageNames.TwoStepApproval;

          // Check if transaction is complete via query parameter
          const isTransactionComplete = url.searchParams.get("transactionStatus") === "complete";
          if (isTransactionComplete) {
            navigation.setParams({
              swapNavigationParams: { tab: tabParam, page, canGoBack, isTransactionComplete: true },
            });
            return;
          }
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
