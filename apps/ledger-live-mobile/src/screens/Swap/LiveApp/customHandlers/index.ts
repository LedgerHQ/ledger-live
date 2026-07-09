import { CompleteExchangeUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  NavigationProp,
  NavigationState,
  StackActions,
  useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BigNumber from "bignumber.js";
import { useCallback } from "react";
import { Dispatch } from "redux";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { sendSwapLiveAppReady } from "~/e2e/bridge/client";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";

export type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

/** Navigation typed with {@link BASE_NAVIGATOR_ID} so `getParent(BASE_NAVIGATOR_ID)` is type-safe. */
type SwapBaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

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

      // React Navigation v7 pushes a new screen even if one already exists lower
      // in the stack. Dispatching replace to BaseNavigator gives SwapSubScreensNavigator
      // a clean [SwapPendingOperation] stack with no SwapLoading beneath it, so
      // any back gesture returns to SwapTab instead of revealing SwapLoading.
      const baseNavigation = navigation.getParent(BASE_NAVIGATOR_ID);
      if (baseNavigation) {
        baseNavigation.dispatch(
          StackActions.replace(NavigatorName.SwapSubScreens, {
            screen: ScreenName.SwapPendingOperation,
            params,
          }),
        );
      } else {
        navigation.navigate(NavigatorName.SwapSubScreens, {
          screen: ScreenName.SwapPendingOperation,
          params,
        });
      }

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

  const navigateToSwapHistory = useCallback(() => {
    const baseNavigation = navigation.getParent(BASE_NAVIGATOR_ID);
    if (baseNavigation) {
      baseNavigation.dispatch(
        StackActions.replace(NavigatorName.SwapSubScreens, {
          screen: ScreenName.SwapHistory,
        }),
      );
    } else {
      navigation.navigate(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
      });
    }
    resetWebview();
  }, [navigation, resetWebview]);

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
