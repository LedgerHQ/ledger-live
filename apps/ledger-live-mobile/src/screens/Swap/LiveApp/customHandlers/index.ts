import { CompleteExchangeUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { NavigationProp, NavigationState, useNavigation } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { useCallback } from "react";
import { Dispatch } from "redux";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import { ScreenName } from "~/const";
import { sendSwapLiveAppReady } from "../../../../../e2e/bridge/client";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";

export type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

export function useSwapCustomHandlers(
  manifest: WebviewProps["manifest"],
  accounts: AccountLike[],
  dispatch: Dispatch,
) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const navigateToSwapPendingOperation = useCallback(
    (exchangeParams: CompleteExchangeUiRequest, operationHash: string) => {
      navigation.navigate(ScreenName.SwapPendingOperation, {
        swapOperation: {
          provider: exchangeParams.provider,
          swapId: exchangeParams.swapId!,
          status: "pending",
          receiverAccountId: exchangeParams.transaction.recipient,
          operationId: operationHash,
          fromAmount: exchangeParams.transaction.amount,
          toAmount: BigNumber(exchangeParams.amountExpectedTo!),
        },
      });
    },
    [navigation],
  );

  const navigateToSwapCustomError = useCallback(
    (error: Error) => {
      navigation.navigate(ScreenName.SwapCustomError, {
        error,
      });
    },
    [navigation],
  );

  const walletAPISwapHandlers = useCustomExchangeHandlers({
    manifest,
    accounts,
    onCompleteResult: navigateToSwapPendingOperation,
    onCompleteError: navigateToSwapCustomError,
    sendAppReady: sendSwapLiveAppReady,
  });

  const swapCustomHandlers = {
    "custom.getFee": getFee(accounts, navigation),
    "custom.getTransactionByHash": getTransactionByHash(accounts),
    "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
    "custom.swapRedirectToHistory": () => navigation.navigate(ScreenName.SwapHistory),
  };

  return {
    ...walletAPISwapHandlers,
    ...swapCustomHandlers,
  } as WalletAPICustomHandlers;
}
