import { CompleteExchangeUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  NavigationProp,
  NavigationState,
  type NavigatorScreenParams,
  useNavigation,
} from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { useCallback } from "react";
import { Dispatch } from "redux";
import type { SwapSubScreensNavigatorParamList } from "~/components/RootNavigator/types/SwapSubScreensNavigator";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import { NavigatorName, ScreenName } from "~/const";
import { sendSwapLiveAppReady } from "~/e2e/bridge/client";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { openSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";
import type { SwapHistoryParams } from "../../types";
import { openSwapSubScreens, type SwapBaseNavigation } from "../../navigation/openSwapSubScreens";

export type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

export function useSwapCustomHandlers(
  manifest: WebviewProps["manifest"],
  accounts: AccountLike[],
  dispatch: Dispatch,
  resetWebview: () => void,
) {
  const navigation = useNavigation<SwapBaseNavigation>();

  const navigateToSwapPendingOperation = useCallback(
    (exchangeParams: CompleteExchangeUiRequest, operationHash: string) => {
      const params = {
        swapOperation: {
          provider: exchangeParams.provider,
          swapId: exchangeParams.swapId!,
          status: "pending",
          receiverAccountId: exchangeParams.transaction.recipient,
          toCurrency: (exchangeParams.exchange as ExchangeSwap).toCurrency,
          fromCurrency: (exchangeParams.exchange as ExchangeSwap).fromCurrency,
          operationId: operationHash,
          fromAmount: exchangeParams.transaction.amount,
          toAmount: BigNumber(exchangeParams.amountExpectedTo!),
        },
        isEmbeddedSwap: exchangeParams.isEmbeddedSwap,
        sponsored: exchangeParams.sponsored,
      };

      openSwapSubScreens({
        navigation,
        target: { screen: ScreenName.SwapPendingOperation, params },
      });

      // Remount the webview to its initial URL while the user reads the success
      // screen so they see a clean swap form when they navigate back to SwapTab.
      // loadURL(initialURL) would be a no-op because React sees no state change
      // when currentURI already equals initialURL (the webview navigated internally
      // without updating React state). Incrementing the key forces a true remount.
      resetWebview();
    },
    [navigation, resetWebview],
  );

  const navigateToSwapCustomError = useCallback(
    (error: Error) => {
      navigation.navigate(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapCustomError,
        params: { error },
      });
    },
    [navigation],
  );

  const handleShowLoadingDrawer = useCallback(() => {
    navigation.navigate(NavigatorName.SwapSubScreens, {
      screen: ScreenName.SwapLoading,
    });
  }, [navigation]);

  const navigateToSwapHistory = useCallback(
    ({ params }: { params?: SwapHistoryParams } = {}) => {
      // Annotated so `screen` keeps its literal type: in an unannotated object literal
      // TypeScript widens the enum member to `ScreenName`, which no longer satisfies
      // the navigator's screen/params pairing.
      const historyScreen: NavigatorScreenParams<SwapSubScreensNavigatorParamList> = {
        screen: ScreenName.SwapHistory,
        ...(params?.swapId ? { params: { swapId: params.swapId } } : {}),
      };

      openSwapSubScreens({ navigation, target: historyScreen });

      // The live app stays mounted underneath on the page it redirected from, so remount
      // it to its initial URL. The Swap tab is already blurred here, hence the reset is
      // re-asserted on focus by useSwapLiveAppState.
      resetWebview();

      // Open the transaction status drawer directly, mirroring the native
      // SwapPendingOperation success screen. The multi-step flow reaches history
      // through this webview redirect (not the native success screen), so relying
      // on route-param matching against the synced swap history is racy on mobile —
      // the just-broadcast operation may not yet be in the history list. Dispatching
      // here opens the drawer immediately; useAutoOpenSwapDrawer still covers the
      // fallback once the operation resolves. Independent of the navigation strategy
      // above: the status drawer is a global drawer, mounted outside the navigators.
      if (params?.swapId) {
        dispatch(
          openSwapTransactionStatusDrawer({
            swapId: params.swapId,
            provider: params.provider,
          }),
        );
      }
    },
    [navigation, resetWebview, dispatch],
  );

  const walletAPISwapHandlers = useCustomExchangeHandlers({
    manifest,
    accounts,
    onCompleteResult: navigateToSwapPendingOperation,
    onCompleteError: navigateToSwapCustomError,
    sendAppReady: sendSwapLiveAppReady,
    handleLoaderDrawer: handleShowLoadingDrawer,
  });

  const swapCustomHandlers = {
    "custom.getFee": getFee(accounts, navigation),
    "custom.getTransactionByHash": getTransactionByHash(accounts),
    "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
    "custom.swapRedirectToHistory": navigateToSwapHistory,
  };

  return {
    ...walletAPISwapHandlers,
    ...swapCustomHandlers,
  } as WalletAPICustomHandlers;
}
