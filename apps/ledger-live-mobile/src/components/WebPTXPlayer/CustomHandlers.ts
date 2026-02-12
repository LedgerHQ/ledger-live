import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  CompleteExchangeUiRequest,
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import {
  WalletAPICustomHandlers,
  AccountIdFormatsResponse,
} from "@ledgerhq/live-common/wallet-api/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { WebviewProps } from "../Web3AppWebview/types";
import Config from "react-native-config";
import { sendEarnLiveAppReady } from "../../../e2e/bridge/client";
import { useSyncAccountById } from "~/screens/Swap/LiveApp/hooks/useSyncAccountById";
import {
  getParentAccount,
  isTokenAccount,
  makeEmptyTokenAccount,
} from "@ledgerhq/coin-framework/account/helpers";
import {
  decodeTokenAccountIdSync,
  decodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { useStakingDrawer } from "~/components/Stake/useStakingDrawer";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { usesEncodedAccountIdFormat } from "@ledgerhq/live-common/wallet-api/utils/deriveAccountIdForManifest";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { useDispatch } from "~/context/hooks";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";

const DrawerClosedError = createCustomErrorClass("DrawerClosedError");
const drawerClosedError = new DrawerClosedError("User closed the drawer");
const unknownSwapError = new Error("Unknown swap error");

type CustomExchangeHandlersHookType = {
  manifest: WebviewProps["manifest"];
  accounts: AccountLike[];
  sendAppReady: () => void;
  onCompleteResult?: (exchangeParams: CompleteExchangeUiRequest, operationHash: string) => void;
  onCompleteError?: (error: Error) => void;
  handleLoaderDrawer?: () => void;
};

export function useCustomExchangeHandlers({
  manifest,
  accounts,
  onCompleteResult,
  sendAppReady,
  onCompleteError,
  handleLoaderDrawer,
}: CustomExchangeHandlersHookType) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const route = useRoute();
  const [device, setDevice] = useState<Device>();
  const deviceRef = useRef<Device | undefined>(undefined);
  const syncAccountById = useSyncAccountById();
  const dispatch = useDispatch();
  const { state: liveAppRegistryState } = useRemoteLiveAppContext();
  const { state: localLiveAppState } = useLocalLiveAppContext();

  const { handleOpenStakeDrawer } = useOpenStakeDrawer({
    sourceScreenName: "earn_redirect_provider",
  });

  const goToAccountStakeFlow = useStakingDrawer({
    navigation: navigation.getParent() || navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  const getAccount = useCallback(
    async (accountId: string): Promise<AccountLike | null> => {
      const foundAccount = accounts.find(acc => acc.id === accountId);

      if (foundAccount) {
        return foundAccount;
      }

      if (accountId.includes("+")) {
        const { accountId: parentAccountId } = decodeTokenAccountIdSync(accountId);

        const parentAccount = accounts.find(
          acc => acc.type === "Account" && acc.id === parentAccountId,
        ) as Account | undefined;

        const { token } = await decodeTokenAccountId(accountId);

        if (parentAccount && token) {
          return makeEmptyTokenAccount(parentAccount, token);
        }
      }

      return null;
    },
    [accounts],
  );

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

  // Add refs to track active promises
  const activePromises = useRef<
    Map<
      string,
      {
        reject: (error: Error) => void;
      }
    >
  >(new Map());

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

  // Add cleanup function for navigation events
  useEffect(() => {
    // Listen for focus events to detect when coming back to this screen
    const unsubscribeFocus = navigation.addListener("focus", () => {
      // When we come back to this screen, check if any promises are still pending
      // This happens when user navigates back without completing the action
      const pendingPromises = Array.from(activePromises.current.keys());

      if (pendingPromises.length > 0) {
        activePromises.current.forEach(({ reject }, key) => {
          reject(drawerClosedError);
          activePromises.current.delete(key);
        });
      }
    });

    return () => {
      unsubscribeFocus();
    };
  }, [navigation]);

  return useMemo<WalletAPICustomHandlers>(() => {
    const ptxCustomHandlers = {
      "custom.close": () => {
        navigation.getParent()?.navigate(NavigatorName.Base, {
          screen: NavigatorName.Main,
        });
      },
      "custom.getFunds": (request: { params?: { accountId?: string; currencyId?: string } }) => {
        const accountId = request.params?.accountId;

        return new Promise<void>((resolve, reject) => {
          (async () => {
            try {
              if (accountId) {
                const id = getAccountIdFromWalletAccountId(accountId);
                if (!id) {
                  reject(new Error("Invalid accountId"));
                  return;
                }
                const account = await getAccount(id);

                if (!account) {
                  reject(new Error("Account not found"));
                  return;
                }

                navigation.navigate(NavigatorName.NoFundsFlow, {
                  screen: ScreenName.NoFunds,
                  params: {
                    account,
                    parentAccount: isTokenAccount(account)
                      ? getParentAccount(account, accounts)
                      : undefined,
                  },
                });

                resolve();
              }
            } catch (error) {
              reject(error);
            }
          })();
        });
      },
      "custom.navigate": async (request: {
        params?: { action?: string; currencyId?: string; accountId?: string; source?: string };
      }) => {
        const { action } = request.params || {};

        if (!action) {
          throw new Error("Missing action parameter");
        }

        if (action === "go-back") {
          navigation.goBack();
          return { success: true };
        } else if (action === "redirect-provider") {
          const { accountId: walletAccountId } = request.params || {};

          if (walletAccountId) {
            // If we have a specific account, go directly to the stake flow for that account
            const accountId = getAccountIdFromWalletAccountId(walletAccountId);
            const account = accounts.find(acc => acc.id === accountId);

            if (account) {
              const parentAccount = isTokenAccount(account)
                ? getParentAccount(account, accounts)
                : undefined;

              // Go directly to stake flow for this specific account
              goToAccountStakeFlow(account, parentAccount);
              return { success: true };
            }
          }

          // If no account specified or not found, open the general stake drawer
          handleOpenStakeDrawer();

          return { success: true };
        }
        throw new Error("Unknown navigation action");
      },
      "custom.getAccountIdFormats": async (request: { params?: { liveAppIds?: string[] } }) => {
        const { liveAppIds } = request.params || {};

        if (!liveAppIds) {
          throw new Error("Missing liveAppIds parameter");
        }

        if (!Array.isArray(liveAppIds)) {
          throw new Error("liveAppIds must be an array");
        }

        const results: AccountIdFormatsResponse = {};

        // For each liveAppId, fetch the manifest and check if it uses uuid format
        for (const liveAppId of liveAppIds) {
          try {
            const fetchedManifest = getManifestById(liveAppId);

            if (fetchedManifest) {
              results[liveAppId] = usesEncodedAccountIdFormat(fetchedManifest) ? "encoded" : "uuid";
            } else {
              // If manifest not found, default to "encoded" (safer fallback)
              results[liveAppId] = "encoded";
            }
          } catch {
            // On error, default to "encoded" format
            results[liveAppId] = "encoded";
          }
        }

        return results;
      },
    };

    return {
      ...exchangeHandlers({
        accounts,
        tracking,
        manifest,
        uiHooks: {
          "custom.exchange.start": ({ exchangeParams, onSuccess, onCancel }) => {
            const promiseId = `start-${Date.now()}`;

            navigation.navigate(NavigatorName.PlatformExchange, {
              screen: ScreenName.PlatformStartExchange,
              params: {
                request: {
                  ...exchangeParams,
                  exchangeType: ExchangeType[exchangeParams.exchangeType],
                },
                onResult: result => {
                  // Clean up promise tracking
                  activePromises.current.delete(promiseId);

                  if (result.startExchangeError) {
                    onCancel(
                      result.startExchangeError.error,
                      result.startExchangeError.device || device,
                    );
                  }

                  if (result.startExchangeResult) {
                    setDevice(result.device);
                    deviceRef.current = result.device;
                    onSuccess(
                      result.startExchangeResult.nonce,
                      result.startExchangeResult.device || result.device,
                    );
                  }
                  navigation.pop();
                  handleLoaderDrawer?.();
                },
                onClose: () => onCancel(drawerClosedError),
              },
            });

            // Track the promise
            activePromises.current.set(promiseId, {
              reject: onCancel,
            });
          },
          "custom.exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
            if (handleLoaderDrawer) {
              navigation.pop();
            }
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
                  sponsored: exchangeParams.sponsored,
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
                onClose: () => onCancel(drawerClosedError),
              },
            });
          },
          "custom.exchange.error": ({ error }) => {
            if (handleLoaderDrawer) {
              navigation.pop();
            }

            navigation.navigate(ScreenName.SwapCustomError, {
              error: error ?? unknownSwapError,
            });
          },
          "custom.isReady": async () => {
            if (Config.DETOX) {
              sendAppReady();
            }
          },
          "custom.exchange.swap": ({ exchangeParams, onSuccess, onCancel }) => {
            if (handleLoaderDrawer) {
              navigation.pop();
            }
            let cancelCalled = false;

            const safeOnCancel = (error: Error) => {
              if (!cancelCalled) {
                cancelCalled = true;
                onCancel(error);
              }
            };

            const currentDevice = deviceRef.current || device;

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
                  sponsored: exchangeParams.sponsored,
                },
                device: currentDevice,
                onResult: result => {
                  if (result.error) {
                    safeOnCancel(result.error);
                    navigation.pop();
                    onCompleteError?.(result.error);
                  }
                  if (result.operation && exchangeParams.swapId) {
                    syncAccountById(exchangeParams.exchange.fromAccount.id);
                    const operationHash = result.operation.hash;

                    onCompleteResult?.(exchangeParams, operationHash);

                    const params = getUpdateAccountWithUpdaterParams({
                      result: { operation: result.operation, swapId: exchangeParams.swapId },
                      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                      exchange: exchangeParams.exchange as ExchangeSwap,
                      transaction: exchangeParams.transaction,
                      magnitudeAwareRate: exchangeParams.magnitudeAwareRate!,
                      provider: exchangeParams.provider,
                    });

                    if (!params.length) return;
                    const dispatchAction = updateAccountWithUpdater({
                      accountId: params[0],
                      updater: params[1],
                    });
                    dispatch(dispatchAction);

                    // return success to swap live app
                    onSuccess({ operationHash, swapId: exchangeParams.swapId });
                  }
                  setDevice(undefined);
                  deviceRef.current = undefined;
                },
                onClose: () => safeOnCancel(drawerClosedError),
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
    handleLoaderDrawer,
    sendAppReady,
    syncAccountById,
    tracking,
    handleOpenStakeDrawer,
    goToAccountStakeFlow,
    getManifestById,
    getAccount,
    dispatch,
  ]);
}

export function usePTXCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  return useCustomExchangeHandlers({ manifest, accounts, sendAppReady: sendEarnLiveAppReady });
}
