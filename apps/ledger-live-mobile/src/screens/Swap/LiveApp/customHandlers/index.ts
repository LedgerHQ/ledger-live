import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { NavigationProp, NavigationState, useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { NavigatorName, ScreenName } from "~/const";
import Config from "react-native-config";
import BigNumber from "bignumber.js";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { sendSwapLiveAppReady } from "../../../../../e2e/bridge/client";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { Dispatch } from "redux";

export type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

export function useSwapCustomHandlers(
  manifest: WebviewProps["manifest"],
  accounts: AccountLike[],
  dispatch: Dispatch,
) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const [device, setDevice] = useState<Device>();

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
              },
            });
          },
        },
      }),
    };
  }, [accounts, device, manifest, navigation, tracking]);

  const swapCustomHandlers = {
    "custom.getFee": getFee(accounts, navigation),
    "custom.getTransactionByHash": getTransactionByHash(accounts),
    "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
    "custom.swapRedirectToHistory": () => null,
    "custom.isReady": async () => {
      if (Config.DETOX) {
        sendSwapLiveAppReady();
      }
    },
  };

  return {
    ...walletAPISwapHandlers,
    ...swapCustomHandlers,
  } as WalletAPICustomHandlers;
}
