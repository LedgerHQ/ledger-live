import {
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { closePlatformAppDrawer, openExchangeDrawer } from "~/renderer/actions/UI";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { track } from "~/renderer/analytics/segment";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer from "~/renderer/screens/exchange/Swap2/Form/WebviewErrorDrawer";
import { WebviewProps } from "../Web3AppWebview/types";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { openModal } from "~/renderer/actions/modals";
import { getParentAccount, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import logger from "~/renderer/logger";

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  const dispatch = useDispatch();
  const { setDrawer } = React.useContext(context);
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
                onResult: result => {
                  onSuccess(result.nonce, result.device);
                },
                onCancel: cancelResult => {
                  onCancel(cancelResult.error, cancelResult.device);
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
          "custom.exchange.error": ({ error }) => {
            dispatch(closePlatformAppDrawer());
            setDrawer(WebviewErrorDrawer, error);
            return Promise.resolve();
          },
          "custom.isReady": async () => {
            console.info("Earn Live App Loaded");
          },
          "custom.exchange.swap": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_COMPLETE",
                ...exchangeParams,
                onResult: operation => {
                  if (operation && exchangeParams.swapId) {
                    // return success to swap live app
                    onSuccess({
                      operationHash: operation.hash,
                      swapId: exchangeParams.swapId,
                    });
                  }
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
      "custom.getFunds": request => {
        const accountId = request.params?.accountId;

        if (!accountId) {
          logger.warn("accountId is missing for custom.getFunds");
          throw new Error("accountId is required");
        }

        try {
          const id = getAccountIdFromWalletAccountId(accountId);
          const account = accounts.find(acc => acc.id === id);

          if (!account) {
            logger.warn("Account not found for custom.getFunds", { accountId });
            throw new Error("Account not found");
          }

          dispatch(
            openModal("MODAL_NO_FUNDS_STAKE", {
              account,
              parentAccount: isTokenAccount(account)
                ? getParentAccount(account, accounts)
                : undefined,
            }),
          );

          return Promise.resolve();
        } catch (error) {
          logger.error("Error in custom.getFunds handler", error);
          throw error;
        }
      },
    };
  }, [accounts, tracking, manifest, dispatch, setDrawer]);
}
