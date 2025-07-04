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

<<<<<<< HEAD
  const walletAPISwapHandlers = useCustomExchangeHandlers({
    manifest,
    accounts,
    onCompleteResult: navigateToSwapPendingOperation,
    sendAppReady: sendSwapLiveAppReady,
  });
=======
  const walletAPISwapHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...exchangeHandlers({
        accounts,
        tracking,
        manifest,
        uiHooks: {
          "custom.exchange.start": ({ exchangeParams, onSuccess, onCancel }) => {
            navigation.navigate(NavigatorName.PlatformExchange, {
              screen: ScreenName.PlatformStartExchange,
              params: {
                request: {
                  ...exchangeParams,
                  exchangeType: ExchangeType[exchangeParams.exchangeType],
                },
                onResult: result => {
                  if (result.startExchangeError) {
                    onCancel(
                      result.startExchangeError.error,
                      result.startExchangeError.device || device,
                    );
                  }

                  if (result.startExchangeResult) {
                    setDevice(result.device);
                    onSuccess(
                      result.startExchangeResult.nonce,
                      result.startExchangeResult.device || device,
                    );
                  }

                  navigation.pop();
                },
              },
            });
          },
          "custom.exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
            navigation.navigate(NavigatorName.PlatformExchange, {
              screen: ScreenName.PlatformCompleteExchange,
              params: {
                request: {
                  exchangeType: exchangeParams.exchangeType,
                  provider: exchangeParams.provider,
                  exchange: exchangeParams.exchange,
                  transaction: exchangeParams.transaction,
                  binaryPayload: exchangeParams.binaryPayload,
                  signature: exchangeParams.signature,
                  feesStrategy: exchangeParams.feesStrategy,
                  amountExpectedTo: exchangeParams.amountExpectedTo,
                },
                device,
                onResult: result => {
                  if (result.error) {
                    onCancel(result.error);
                    navigation.pop();
                    navigation.navigate(NavigatorName.CustomError, {
                      screen: ScreenName.CustomErrorScreen,
                      params: {
                        error: result.error,
                        displayError: result.error instanceof AddressesSanctionedError,
                      },
                    });
                  }
                  if (result.operation) {
                    navigation.pop();
                    navigation.navigate(ScreenName.SwapPendingOperation, {
                      swapOperation: {
                        provider: exchangeParams.provider,
                        swapId: exchangeParams.swapId!,
                        status: "pending",
                        receiverAccountId: exchangeParams.transaction.recipient,
                        operationId: result.operation.hash,
                        fromAmount: exchangeParams.transaction.amount,
                        toAmount: BigNumber(exchangeParams.amountExpectedTo!),
                      },
                    });
                    onSuccess(result.operation.hash);
                  }
                  setDevice(undefined);
                },
              },
            });
          },
          "custom.isReady": async () => {
            if (Config.DETOX) {
              sendSwapLiveAppReady();
            }
          },
          "custom.exchange.error": ({ error }) => {
            navigation.navigate(NavigatorName.CustomError, {
              screen: ScreenName.CustomErrorScreen,
              params: {
                error,
                displayError: error instanceof AddressesSanctionedError,
              },
            });
          },
        },
      }),
    };
  }, [accounts, device, manifest, navigation, tracking]);
>>>>>>> 64a6a296fc (fix swap)

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
