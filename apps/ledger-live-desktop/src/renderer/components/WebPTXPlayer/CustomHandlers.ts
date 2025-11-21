import {
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import {
  WalletAPICustomHandlers,
  AccountIdFormatsResponse,
} from "@ledgerhq/live-common/wallet-api/types";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { useStake } from "LLD/hooks/useStake";
import { StakeFlowProps } from "~/renderer/screens/stake";
import { useHistory } from "react-router";
import { walletSelector } from "~/renderer/reducers/wallet";
import { objectToURLSearchParams } from "@ledgerhq/live-common/wallet-api/helpers";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { usesEncodedAccountIdFormat } from "@ledgerhq/live-common/wallet-api/utils/deriveAccountIdForManifest";

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  const dispatch = useDispatch();
  const { setDrawer } = React.useContext(context);
  const { getRouteToPlatformApp } = useStake();
  const history = useHistory();
  const walletState = useSelector(walletSelector);
  const { state: liveAppRegistryState } = useRemoteLiveAppContext();
  const { state: localLiveAppState } = useLocalLiveAppContext();

  // Helper to get manifest by ID - checks local first, then remote
  const getManifestById = useCallback(
    (liveAppId: string) => {
      // Check local manifests first (takes precedence)
      const localManifest = localLiveAppState?.find(app => app.id === liveAppId);
      if (localManifest) return localManifest;

      // Fall back to remote manifests
      return (
        liveAppRegistryState.value?.liveAppFilteredById?.[liveAppId] ||
        liveAppRegistryState.value?.liveAppById?.[liveAppId]
      );
    },
    [liveAppRegistryState, localLiveAppState],
  );

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

  const startStakeFlow = useCallback(
    (props: {
      account: AccountLike;
      parentAccount: Account | undefined;
      alwaysShowNoFunds: StakeFlowProps["alwaysShowNoFunds"];
      entryPoint: StakeFlowProps["entryPoint"];
      source: StakeFlowProps["source"];
      returnTo?: string;
    }) => {
      const { account, parentAccount, alwaysShowNoFunds, entryPoint, source, returnTo } = props;
      const platformAppRoute = getRouteToPlatformApp(account, walletState, parentAccount, returnTo);

      if (alwaysShowNoFunds || account.spendableBalance.isZero()) {
        dispatch(
          openModal("MODAL_NO_FUNDS_STAKE", {
            account,
            parentAccount,
            entryPoint,
          }),
        );
      } else if (platformAppRoute) {
        // Convert state object to query parameters to trigger middleware in child app
        const stateObj = {
          ...platformAppRoute.state,
          returnTo,
        };
        const queryParams = objectToURLSearchParams(stateObj);

        // Push to history with both state and query params
        const searchStr = `?${queryParams.toString() ?? ""}`;

        history.push({
          pathname: platformAppRoute.pathname.toString(),
          search: searchStr,
          state: stateObj, // Keep state object for components that rely on it
        });
      } else {
        dispatch(openModal("MODAL_START_STAKE", { account, parentAccount, source }));
      }
    },
    [dispatch, getRouteToPlatformApp, history, walletState],
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
            let cancelCalled = false;
            const safeOnCancel = (error: Error) => {
              if (!cancelCalled) {
                console.error(error);
                cancelCalled = true;
                onCancel(error);
              }
            };

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
                onCancel: safeOnCancel,
              }),
            );
          },
        },
      }),
      "custom.navigate": async request => {
        const { action } = request.params || {};

        if (!action) {
          throw new Error("Missing action parameter");
        }

        if (action === "go-back") {
          // Handle back navigation using history
          history.goBack();
          return { success: true };
        } else if (action === "redirect-provider") {
          const { currencyId, accountId, source } = request.params || {};

          if (!currencyId) {
            throw new Error("Missing currencyId parameter");
          }

          if (!accountId) {
            throw new Error("Missing accountId parameter");
          }

          // Find the account that matches the accountId
          const matchingAccountId = getAccountIdFromWalletAccountId(accountId);
          if (!matchingAccountId) {
            throw new Error("Invalid accountId format");
          }

          const matchingAccount = accounts.find(acc => acc.id === matchingAccountId);
          if (!matchingAccount) {
            throw new Error(`No matching account found for currency ${currencyId}`);
          }

          let parentAccount: Account | undefined;

          // Get parent account if it's a token account
          if (matchingAccount.type === "TokenAccount") {
            const tokenAccount = matchingAccount;
            const foundParentAccount = accounts.find(
              a => a.type === "Account" && a.id === tokenAccount.parentId,
            );
            parentAccount = foundParentAccount?.type === "Account" ? foundParentAccount : undefined;
          }

          startStakeFlow({
            account: matchingAccount,
            parentAccount,
            alwaysShowNoFunds: false,
            entryPoint: "get-funds",
            source,
          });
          return { success: true };
        }
        throw new Error("Unknown navigation action");
      },
      "custom.getFunds": request => {
        const accountId = request.params?.accountId;

        if (!accountId) {
          throw new Error("accountId is required");
        }

        try {
          const id = getAccountIdFromWalletAccountId(accountId);
          const account = accounts.find(acc => acc.id === id);

          if (!account) {
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
      "custom.getAccountIdFormats": async request => {
        const { liveAppIds } = request.params || {};

        if (!liveAppIds) {
          throw new Error("Missing liveAppIds parameter");
        }

        if (!Array.isArray(liveAppIds)) {
          throw new Error("liveAppIds must be an array");
        }

        try {
          const results: AccountIdFormatsResponse = {};

          // For each liveAppId, fetch the manifest and check if it uses uuid format
          for (const liveAppId of liveAppIds) {
            try {
              const fetchedManifest = getManifestById(liveAppId);

              if (fetchedManifest) {
                results[liveAppId] = usesEncodedAccountIdFormat(fetchedManifest)
                  ? "encoded"
                  : "uuid";
              } else {
                // If manifest not found, default to "encoded" (safer fallback)
                results[liveAppId] = "encoded";
              }
            } catch (error) {
              // On error, default to "encoded" format
              results[liveAppId] = "encoded";
            }
          }

          return results;
        } catch (error) {
          logger.error("Error in custom.getAccountIdFormats handler", error);
          throw error;
        }
      },
    };
  }, [accounts, tracking, manifest, dispatch, setDrawer, history, startStakeFlow, getManifestById]);
}
