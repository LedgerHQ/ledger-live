import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { handlers as exchangeHandlers } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/types";
import { useNavigation } from "@react-navigation/native";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { WebviewProps } from "../Web3AppWebview/types";

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"]) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const [device, setDevice] = useState<Device>();
  const accounts = useSelector(flattenAccountsSelector);

  const tracking = useMemo(
    () =>
      trackingWrapper(
        (
          eventName: string,
          properties?: Record<string, unknown> | null,
          mandatory?: boolean | null,
        ) =>
          track(
            eventName,
            {
              ...properties,
              flowInitiatedFrom:
                currentRouteNameRef.current === "Platform Catalog"
                  ? "Discover"
                  : currentRouteNameRef.current,
            },
            mandatory,
          ),
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
          "custom.exchange.start": ({ exchangeType, onSuccess, onCancel }) => {
            navigation.navigate(NavigatorName.PlatformExchange, {
              screen: ScreenName.PlatformStartExchange,
              params: {
                request: {
                  exchangeType: ExchangeType[exchangeType],
                },
                onResult: result => {
                  if (result.startExchangeError) {
                    onCancel(result.startExchangeError);
                  }

                  if (result.startExchangeResult) {
                    setDevice(result.device);
                    onSuccess(result.startExchangeResult);
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
                },
                device,
                onResult: result => {
                  if (result.error) {
                    onCancel(result.error);
                  }
                  if (result.operation) {
                    onSuccess(result.operation.id);
                  }
                  setDevice(undefined);
                  navigation.pop();
                },
              },
            });
          },
        },
      }),
    };
  }, [accounts, device, manifest, navigation, tracking]);
}
