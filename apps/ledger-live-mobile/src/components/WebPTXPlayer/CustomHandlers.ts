import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  CompleteExchangeUiRequest,
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState, useRef } from "react";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { WebviewProps } from "../Web3AppWebview/types";
import Config from "react-native-config";
import { sendEarnLiveAppReady } from "../../../e2e/bridge/client";
import { useSyncAccountById } from "~/screens/Swap/LiveApp/hooks/useSyncAccountById";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/lib/sanction/errors";

type CustomExchangeHandlersHookType = {
  manifest: WebviewProps["manifest"];
  accounts: AccountLike[];
  sendAppReady: () => void;
  onCompleteResult?: (exchangeParams: CompleteExchangeUiRequest, operationHash: string) => void;
  onCompleteError?: (error: Error) => void;
};

export function useCustomExchangeHandlers({
  manifest,
  accounts,
  onCompleteResult,
  sendAppReady,
  onCompleteError,
}: CustomExchangeHandlersHookType) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const [device, setDevice] = useState<Device>();
  const deviceRef = useRef<Device>();
  const syncAccountById = useSyncAccountById();

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
    const ptxCustomHandlers = {
      "custom.close": () => {
        navigation.popToTop();
      },
    };

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
                    deviceRef.current = result.device; // Store in ref for immediate access
                    onSuccess(
                      result.startExchangeResult.nonce,
                      result.startExchangeResult.device || result.device,
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
                  navigation.pop();
                  if (result.error) {
                    onCancel(result.error);

                    navigation.navigate(ScreenName.SwapCustomError, {
                      error: result.error,
                    });
                  }

                  if (result.operation) {
                    const operationHash = result.operation.hash;
                    onCompleteResult?.(exchangeParams, operationHash);
                    onSuccess(result.operation.hash);
                  }
                  setDevice(undefined);
                  deviceRef.current = undefined;
                },
              },
            });
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
          "custom.isReady": async () => {
            if (Config.DETOX) {
              sendAppReady();
            }
          },
          "custom.exchange.swap": ({ exchangeParams, onSuccess, onCancel }) => {
            const currentDevice = deviceRef.current || device; // Use ref value first

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
                device: currentDevice,
                onResult: result => {
                  if (result.error) {
                    onCancel(result.error);
                    navigation.pop();
                    onCompleteError?.(result.error);
                  }
                  if (result.operation && exchangeParams.swapId) {
                    syncAccountById(exchangeParams.exchange.fromAccount.id);
                    const operationHash = result.operation.hash;

                    onCompleteResult?.(exchangeParams, operationHash);

                    // return success to swap live app
                    onSuccess({ operationHash, swapId: exchangeParams.swapId });
                  }
                  setDevice(undefined);
                  deviceRef.current = undefined;
                },
              },
            });
          },
        },
      }),
      ...ptxCustomHandlers,
    };
  }, [
    accounts,
    device,
    manifest,
    navigation,
    onCompleteError,
    onCompleteResult,
    sendAppReady,
    syncAccountById,
    tracking,
  ]);
}

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  return useCustomExchangeHandlers({ manifest, accounts, sendAppReady: sendEarnLiveAppReady });
}
