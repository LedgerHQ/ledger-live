import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { WebviewProps } from "../Web3AppWebview/types";
import {
  saveSwapToHistoryFn,
  SwapProps,
} from "~/screens/Swap/LiveApp/customHandlers/saveSwapToHistory";

import { useDispatch } from "react-redux";

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const [device, setDevice] = useState<Device>();

  const dispatch = useDispatch();
  const tracking = useMemo(
    () =>
      trackingWrapper((eventName: string, properties?: Record<string, unknown> | null) =>
        track(eventName, {
          ...properties,
          flowInitiatedFrom:
            currentRouteNameRef.current === "Platform Catalog"
              ? "Discover"
              : currentRouteNameRef.current,
        }),
      ),
    [],
  );

  return useMemo<WalletAPICustomHandlers>(() => {
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
            console.log("[LLM] custom ehange.complete", exchangeParams);
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
                  console.log("[LLM] on result", result);
                  if (result.error) {
                    onCancel(result.error);
                    navigation.pop();
                    navigation.navigate(NavigatorName.CustomError, {
                      screen: ScreenName.CustomErrorScreen,
                      params: {
                        error: result.error,
                      },
                    });
                  }
                  if (result.operation) {
                    onSuccess(result.operation.id);
                  }
                  setDevice(undefined);
                  !result.error && navigation.pop();
                },
              },
            });
          },
          "custom.exchange.swap": ({ exchangeParams, onSuccess, onCancel }) => {
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
                      },
                    });
                  }
                  if (result.operation) {
                    const transactionHash = result.operation.id;
                    const saveToHistory = saveSwapToHistoryFn(accounts, dispatch, navigation);

                    const historyData: { swap: SwapProps; transaction_id: string } = {
                      swap: {
                        provider: exchangeParams.provider,
                        fromAmount: exchangeParams.transaction.amount.toString(),
                        toAmount: exchangeParams.amountExpectedTo!.toString(),
                        fromAccountId: exchangeParams.fromAccountId!,
                        toAccountId: exchangeParams.toAccountId!,
                        swapId: exchangeParams.swapId!,
                      },
                      transaction_id: result.operation.id,
                    };

                    console.log("[LLM] history data", historyData);

                    saveToHistory({ params: historyData });

                    onSuccess(result.operation.id);
                  }
                  setDevice(undefined);

                  // !result.error && saveToHistory({});
                },
              },
            });
          },
          "custom.exchange.error": ({ error }) => {
            navigation.navigate(NavigatorName.CustomError, {
              screen: ScreenName.CustomErrorScreen,
              params: {
                error,
              },
            });
          },
        },
      }),
    };
  }, [accounts, device, manifest, navigation, tracking]);
}
