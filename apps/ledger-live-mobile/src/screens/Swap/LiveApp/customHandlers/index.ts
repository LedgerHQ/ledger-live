import { CompleteExchangeUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { NavigationProp, NavigationState, useNavigation } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { useCallback } from "react";
import { Dispatch } from "redux";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import { NavigatorName, ScreenName } from "~/const";
import { sendSwapLiveAppReady } from "../../../../../e2e/bridge/client";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

export type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

export function useSwapCustomHandlers(
  manifest: WebviewProps["manifest"],
  accounts: AccountLike[],
  dispatch: Dispatch,
) {
  const navigation = useNavigation<
    StackNavigatorNavigation<BaseNavigatorStackParamList> &
      StackNavigatorNavigation<SwapNavigatorParamList>
  >();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

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
      };

      if (shouldDisplayWallet40MainNav) {
        navigation.navigate(NavigatorName.SwapSubScreens, {
          screen: ScreenName.SwapPendingOperation,
          params,
        });
        return;
      }

      navigation.navigate(ScreenName.SwapPendingOperation, params);
    },
    [navigation, shouldDisplayWallet40MainNav],
  );

  const navigateToSwapCustomError = useCallback(
    (error: Error) => {
      if (shouldDisplayWallet40MainNav) {
        navigation.navigate(NavigatorName.SwapSubScreens, {
          screen: ScreenName.SwapCustomError,
          params: { error },
        });
        return;
      }

      navigation.navigate(ScreenName.SwapCustomError, { error });
    },
    [navigation, shouldDisplayWallet40MainNav],
  );

  const handleShowLoadingDrawer = useCallback(() => {
    if (shouldDisplayWallet40MainNav) {
      navigation.navigate(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapLoading,
      });
      return;
    }

    navigation.navigate(ScreenName.SwapLoading);
  }, [navigation, shouldDisplayWallet40MainNav]);

  const navigateToSwapHistory = useCallback(() => {
    if (shouldDisplayWallet40MainNav) {
      navigation.navigate(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
      });
      return;
    }

    navigation.navigate(ScreenName.SwapHistory);
  }, [navigation, shouldDisplayWallet40MainNav]);

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
