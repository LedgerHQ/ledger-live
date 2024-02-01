import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { Operation } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { openExchangeDrawer } from "~/renderer/actions/UI";
import { WebviewProps } from "../Web3AppWebview/types";

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"]) {
  const dispatch = useDispatch();
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
          "custom.exchange.start": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_START",
                ...exchangeParams,
                exchangeType: ExchangeType[exchangeParams.exchangeType],
                onResult: (nonce: string) => {
                  onSuccess(nonce);
                },
                onCancel: (error: Error) => {
                  onCancel(error);
                },
              }),
            );
          },
          "custom.exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_COMPLETE",
                ...exchangeParams,
                onResult: (operation: Operation) => {
                  onSuccess(operation.hash);
                },
                onCancel: (error: Error) => {
                  console.error(error);
                  onCancel(error);
                },
              }),
            );
          },
        },
      }),
    };
  }, [accounts, dispatch, manifest, tracking]);
}
