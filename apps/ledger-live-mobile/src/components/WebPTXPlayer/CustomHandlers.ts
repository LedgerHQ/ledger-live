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
import Config from "react-native-config";
import { sendEarnLiveAppReady } from "../../../e2e/bridge/client";

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
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
                    onSuccess(result.operation.hash);
                  }
                  setDevice(undefined);
                  !result.error && navigation.pop();
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
          "custom.isReady": async () => {
            if (Config.DETOX) {
              sendEarnLiveAppReady();
            }
          },
        },
      }),
    };
  }, [accounts, device, manifest, navigation, tracking]);
}
