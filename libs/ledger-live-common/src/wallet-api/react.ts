import { useMemo, useState, useEffect, useRef, useCallback, RefObject } from "react";
import { useDispatch } from "react-redux";
import semver from "semver";
import { intervalToDuration } from "date-fns";
import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import {
  WalletHandlers,
  ServerConfig,
  WalletAPIServer,
  defaultLogger,
} from "@ledgerhq/wallet-api-server";
import { Transport, Permission } from "@ledgerhq/wallet-api-core";
import { first } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-env";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { endpoints as calEndpoints } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { InfiniteData } from "@reduxjs/toolkit/query/react";
import type {
  TokensDataWithPagination,
  PageParam,
} from "@ledgerhq/cryptoassets/lib/cal-client/state-manager/types";
import { Subject } from "rxjs";
import { StateDB } from "../hooks/useDBRaw";
import { useFeatureFlags } from "../featureFlags/FeatureFlagsContext";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
  setWalletApiIdForAccountId,
} from "./converters";
import { isWalletAPISupportedCurrency } from "./helpers";
import { WalletAPICurrency, AppManifest, WalletAPIAccount, WalletAPICustomHandlers } from "./types";
import { getMainAccount, getParentAccount } from "../account";
import { listSupportedCurrencies } from "../currencies";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { TrackingAPI } from "./tracking";
import {
  bitcoinFamilyAccountGetXPubLogic,
  broadcastTransactionLogic,
  startExchangeLogic,
  completeExchangeLogic,
  CompleteExchangeRequest,
  CompleteExchangeUiRequest,
  receiveOnAccountLogic,
  signMessageLogic,
  signTransactionLogic,
  bitcoinFamilyAccountGetAddressLogic,
  bitcoinFamilyAccountGetPublicKeyLogic,
  signRawTransactionLogic,
} from "./logic";
import { handlers as featureFlagsHandlers } from "./FeatureFlags";
import { getAccountBridge } from "../bridge";
import openTransportAsSubject, { BidirectionalEvent } from "../hw/openTransportAsSubject";
import { AppResult } from "../hw/actions/app";
import { Transaction } from "../generated/types";
import {
  DISCOVER_INITIAL_CATEGORY,
  INITIAL_PLATFORM_STATE,
  MAX_RECENTLY_USED_LENGTH,
} from "./constants";
import { DiscoverDB } from "./types";
import { LiveAppManifest } from "../platform/types";
import { ModularDrawerConfiguration } from "./ModularDrawer/types";
import { useCurrenciesUnderFeatureFlag } from "../modularDrawer/hooks/useCurrenciesUnderFeatureFlag";

export function safeGetRefValue<T>(ref: RefObject<T>): NonNullable<T> {
  if (!ref.current) {
    throw new Error("Ref objects doesn't have a current value");
  }
  return ref.current;
}

export function useSetWalletAPIAccounts(accounts: AccountLike[]): void {
  useEffect(() => {
    accounts.forEach(account => {
      setWalletApiIdForAccountId(account.id);
    });
  }, [accounts]);
}

export function useDAppManifestCurrencyIds(manifest: AppManifest) {
  return useMemo(() => {
    return (
      manifest.dapp?.networks.map(network => {
        return network.currency;
      }) ?? []
    );
  }, [manifest.dapp?.networks]);
}

export interface UiHook {
  "account.request": (params: {
    currencyIds?: string[];
    areCurrenciesFiltered?: boolean;
    useCase?: string;
    drawerConfiguration?: ModularDrawerConfiguration;
    onSuccess: (account: AccountLike, parentAccount: Account | undefined) => void;
    onCancel: () => void;
  }) => void;
  "account.receive": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    accountAddress: string;
    onSuccess: (address: string) => void;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => void;
  "message.sign": (params: {
    account: AccountLike;
    message: AnyMessage;
    options: Parameters<WalletHandlers["message.sign"]>[0]["options"];
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "storage.get": WalletHandlers["storage.get"];
  "storage.set": WalletHandlers["storage.set"];
  "transaction.signRaw": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    transaction: string;
    options: Parameters<WalletHandlers["transaction.sign"]>[0]["options"];
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "transaction.sign": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    };
    options: Parameters<WalletHandlers["transaction.sign"]>[0]["options"];
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "transaction.broadcast": (
    account: AccountLike,
    parentAccount: Account | undefined,
    mainAccount: Account,
    optimisticOperation: Operation,
  ) => void;
  "device.transport": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onCancel: () => void;
  }) => void;
  "device.select": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onCancel: () => void;
  }) => void;
  "exchange.start": (params: {
    exchangeType: "SWAP" | "FUND" | "SELL" | "SWAP_NG" | "SELL_NG" | "FUND_NG";
    onSuccess: (nonce: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
}

export function usePermission(manifest: AppManifest): Omit<Permission, "currencyIds"> {
  return useMemo(
    () => ({
      methodIds: manifest.permissions,
    }),
    [manifest],
  );
}

function useTransport(postMessage: (message: string) => void | undefined): Transport {
  return useMemo(() => {
    return {
      onMessage: undefined,
      send: postMessage,
    };
  }, [postMessage]);
}

export function useConfig({
  appId,
  userId,
  tracking,
  wallet,
  mevProtected,
}: ServerConfig): ServerConfig {
  return useMemo(
    () => ({
      appId,
      userId,
      tracking,
      wallet,
      mevProtected,
    }),
    [appId, mevProtected, tracking, userId, wallet],
  );
}

function useDeviceTransport({ manifest, tracking }) {
  const ref = useRef<Subject<BidirectionalEvent> | undefined>(undefined);

  const subscribe = useCallback((deviceId: string) => {
    ref.current = openTransportAsSubject({ deviceId });

    ref.current.subscribe({
      complete: () => {
        ref.current = undefined;
      },
    });
  }, []);

  const close = useCallback(() => {
    ref.current?.complete();
  }, []);

  const exchange = useCallback<WalletHandlers["device.exchange"]>(
    ({ apduHex }) => {
      const subject$ = ref.current;

      return new Promise((resolve, reject) => {
        if (!subject$) {
          reject(new Error("No device transport"));
          return;
        }

        subject$.pipe(first(e => e.type === "device-response" || e.type === "error")).subscribe({
          next: e => {
            if (e.type === "device-response") {
              tracking.deviceExchangeSuccess(manifest);
              resolve(e.data);
              return;
            }
            if (e.type === "error") {
              tracking.deviceExchangeFail(manifest);
              reject(e.error || new Error("deviceExchange: unknown error"));
            }
          },
          error: error => {
            tracking.deviceExchangeFail(manifest);
            reject(error);
          },
        });

        subject$.next({ type: "input-frame", apduHex });
      });
    },
    [manifest, tracking],
  );

  useEffect(() => {
    return () => {
      ref.current?.complete();
    };
  }, []);

  return useMemo(() => ({ ref, subscribe, close, exchange }), [close, exchange, subscribe]);
}

export type useWalletAPIServerOptions = {
  walletState: WalletState;
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
  config: ServerConfig;
  webviewHook: {
    reload: () => void;
    postMessage: (message: string) => void;
  };
  uiHook: Partial<UiHook>;
  customHandlers?: WalletAPICustomHandlers;
};

export function useWalletAPIServer({
  walletState,
  manifest,
  accounts,
  tracking,
  config,
  webviewHook,
  uiHook: {
    "account.request": uiAccountRequest,
    "account.receive": uiAccountReceive,
    "message.sign": uiMessageSign,
    "storage.get": uiStorageGet,
    "storage.set": uiStorageSet,
    "transaction.sign": uiTxSign,
    "transaction.signRaw": uiTxSignRaw,
    "transaction.broadcast": uiTxBroadcast,
    "device.transport": uiDeviceTransport,
    "device.select": uiDeviceSelect,
    "exchange.start": uiExchangeStart,
    "exchange.complete": uiExchangeComplete,
  },
  customHandlers,
}: useWalletAPIServerOptions): {
  onMessage: (event: string) => void;
  server: WalletAPIServer;
  onLoad: () => void;
  onReload: () => void;
  onLoadError: () => void;
  widgetLoaded: boolean;
} {
  // Enables the proper typing on dispatch with RTK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const { getFeature } = useFeatureFlags();
  const permission = usePermission(manifest);
  const transport = useTransport(webviewHook.postMessage);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  // We need to set the wallet API account IDs mapping upfront
  // If we don't want the map to be empty when requesting an account
  useSetWalletAPIAccounts(accounts);

  // Merge featureFlags handler with customHandlers
  const mergedCustomHandlers = useMemo(() => {
    const featureFlagsHandlersInstance = featureFlagsHandlers({ manifest, getFeature });

    return {
      ...featureFlagsHandlersInstance,
      ...customHandlers,
    };
  }, [manifest, customHandlers, getFeature]);

  const server = useMemo(() => {
    const instance = new WalletAPIServer(transport, config, defaultLogger, mergedCustomHandlers);
    instance.setPermissions(permission);
    return instance;
  }, [transport, config, mergedCustomHandlers, permission]);

  const onMessage = useCallback(
    (event: string) => {
      transport.onMessage?.(event);
    },
    [transport],
  );

  useEffect(() => {
    tracking.load(manifest);
  }, [tracking, manifest]);

  // TODO: refactor each handler into its own logic function for clarity
  useEffect(() => {
    server.setHandler("currency.list", async ({ currencyIds }) => {
      tracking.currencyListRequested(manifest);

      try {
        // 1. Parse manifest currency patterns to determine what to include
        const manifestCurrencyIds = manifest.currencies === "*" ? ["**"] : manifest.currencies;

        // 2. Apply query filter early - intersect with manifest patterns
        const queryCurrencyIdsSet = currencyIds ? new Set(currencyIds) : undefined;
        let effectiveCurrencyIds = manifestCurrencyIds;

        if (queryCurrencyIdsSet) {
          // If we have a query filter, narrow down what we need to fetch
          effectiveCurrencyIds = manifestCurrencyIds.flatMap(manifestId => {
            if (manifestId === "**") {
              // Query can ask for anything, so use the query list
              return [...queryCurrencyIdsSet];
            } else if (manifestId.endsWith("/**")) {
              // Pattern like "ethereum/**" - keep tokens from query that match this family
              const family = manifestId.slice(0, -3);
              return [...queryCurrencyIdsSet].filter(qId => qId.startsWith(`${family}/`));
            } else if (queryCurrencyIdsSet.has(manifestId)) {
              // Specific currency/token that's in the query
              return [manifestId];
            }
            // Not in query, skip it
            return [];
          });
        }

        // 3. Parse effective currency IDs to determine what to fetch
        const includeAllCurrencies = effectiveCurrencyIds.includes("**");
        const specificCurrencies = new Set<string>();
        const tokenFamilies = new Set<string>();
        const specificTokenIds = new Set<string>();

        for (const id of effectiveCurrencyIds) {
          if (id === "**") {
            // Already handled above
            continue;
          } else if (id.endsWith("/**")) {
            // Pattern like "ethereum/**" or "solana/**" - include tokens for this family
            const family = id.slice(0, -3);
            tokenFamilies.add(family);
            // Additionally include the parent currency itself
            specificCurrencies.add(family);
          } else if (id.includes("/")) {
            // Specific token ID like "ethereum/erc20/usd__coin"
            specificTokenIds.add(id);
          } else {
            // Specific currency like "bitcoin" or "ethereum"
            specificCurrencies.add(id);
          }
        }

        // 4. Gather all supported parent currencies
        const allCurrencies = listSupportedCurrencies().reduce<WalletAPICurrency[]>((acc, c) => {
          if (isWalletAPISupportedCurrency(c) && !deactivatedCurrencyIds.has(c.id))
            acc.push(currencyToWalletAPICurrency(c));
          return acc;
        }, []);

        // 5. Determine which currencies to include based on patterns
        let includedCurrencies: WalletAPICurrency[] = [];
        if (includeAllCurrencies) {
          includedCurrencies = allCurrencies;
        } else {
          includedCurrencies = allCurrencies.filter(c => specificCurrencies.has(c.id));
        }

        // 6. Fetch specific tokens by ID if any
        const specificTokens: WalletAPICurrency[] = [];
        if (specificTokenIds.size > 0) {
          const tokenPromises = [...specificTokenIds].map(async tokenId => {
            const token = await getCryptoAssetsStore().findTokenById(tokenId);
            return token ? currencyToWalletAPICurrency(token) : null;
          });
          const resolvedTokens = await Promise.all(tokenPromises);
          specificTokens.push(...resolvedTokens.filter((t): t is WalletAPICurrency => t !== null));
        }

        // 7. Determine which token families to fetch (only if not already fetched as specific tokens)
        const familiesToFetch = new Set<string>();
        if (includeAllCurrencies) {
          // Fetch tokens for all currency families
          allCurrencies.forEach(c => {
            if (c.type === "CryptoCurrency") familiesToFetch.add(c.family);
          });
        } else if (tokenFamilies.size > 0) {
          // Only fetch tokens for families explicitly marked with /**
          tokenFamilies.forEach(family => familiesToFetch.add(family));
        }

        // 8. Fetch tokens for relevant families
        const fetchAllPagesForFamily = async (family: string) => {
          const args = { networkFamily: family, pageSize: 1000 };
          let hasNextPage = true;
          let data: InfiniteData<TokensDataWithPagination, PageParam> | undefined;

          while (hasNextPage) {
            const querySub = dispatch(
              calEndpoints.getTokensData.initiate(
                args,
                data ? { direction: "forward" } : undefined,
              ),
            );

            try {
              const result = await querySub;
              data = result.data;
              hasNextPage = result.hasNextPage;
              if (result.error) throw result.error;
            } finally {
              querySub.unsubscribe();
            }
          }

          return (data?.pages ?? []).flatMap(p => p.tokens);
        };

        const tokensByFamily = await Promise.all(
          [...familiesToFetch].map(f => fetchAllPagesForFamily(f)),
        );

        // 9. Combine all results (no additional filter needed since we pre-filtered)
        const result = tokensByFamily.reduce<WalletAPICurrency[]>(
          (acc, tokens) => [...acc, ...tokens.map(t => currencyToWalletAPICurrency(t))],
          [...includedCurrencies, ...specificTokens],
        );

        tracking.currencyListSuccess(manifest);
        return result;
      } catch (err) {
        tracking.currencyListFail(manifest);
        throw err;
      }
    });
  }, [walletState, manifest, server, tracking, dispatch, deactivatedCurrencyIds]);

  useEffect(() => {
    server.setHandler("account.list", ({ currencyIds }) => {
      tracking.accountListRequested(manifest);

      try {
        // 1. Parse manifest currency patterns to determine what to include
        const manifestCurrencyIds = manifest.currencies === "*" ? ["**"] : manifest.currencies;

        // 2. Apply query filter early - intersect with manifest patterns
        const queryCurrencyIdsSet = currencyIds ? new Set(currencyIds) : undefined;
        let effectiveCurrencyIds = manifestCurrencyIds;

        if (queryCurrencyIdsSet) {
          // If we have a query filter, narrow down what we need to check
          effectiveCurrencyIds = manifestCurrencyIds.flatMap(manifestId => {
            if (manifestId === "**") {
              // Query can ask for anything, so use the query list
              return [...queryCurrencyIdsSet];
            } else if (manifestId.endsWith("/**")) {
              // Pattern like "ethereum/**" - keep tokens from query that match this family
              const family = manifestId.slice(0, -3);
              return [...queryCurrencyIdsSet].filter(qId => qId.startsWith(`${family}/`));
            } else if (queryCurrencyIdsSet.has(manifestId)) {
              // Specific currency/token that's in the query
              return [manifestId];
            }
            // Not in query, skip it
            return [];
          });
        }

        // 3. Build a set of allowed currency IDs based on effective patterns
        const allowedCurrencyIds = new Set<string>();
        const includeAllCurrencies = effectiveCurrencyIds.includes("**");
        const tokenFamilyPrefixes = new Set<string>();

        for (const id of effectiveCurrencyIds) {
          if (id === "**") {
            // Will match all currencies
            continue;
          } else if (id.endsWith("/**")) {
            // Pattern like "ethereum/**" - store prefix for matching
            const family = id.slice(0, -3);
            tokenFamilyPrefixes.add(family);
          } else {
            // Specific currency/token ID
            allowedCurrencyIds.add(id);
          }
        }

        // 4. Filter accounts based on effective currency IDs
        const wapiAccounts = accounts.reduce<WalletAPIAccount[]>((acc, account) => {
          const parentAccount = getParentAccount(account, accounts);
          const accountCurrencyId =
            account.type === "TokenAccount" ? account.token.id : account.currency.id;
          const parentCurrencyId =
            account.type === "TokenAccount" ? account.token.parentCurrency.id : account.currency.id;

          // Check if account currency ID matches the effective patterns
          const isAllowed =
            includeAllCurrencies ||
            allowedCurrencyIds.has(accountCurrencyId) ||
            tokenFamilyPrefixes.has(parentCurrencyId);

          if (isAllowed) {
            acc.push(accountToWalletAPIAccount(walletState, account, parentAccount));
          }

          return acc;
        }, []);

        tracking.accountListSuccess(manifest);
        return wapiAccounts;
      } catch (err) {
        tracking.accountListFail(manifest);
        throw err;
      }
    });
  }, [walletState, manifest, server, tracking, uiAccountRequest, accounts]);

  useEffect(() => {
    if (!uiAccountRequest) return;

    server.setHandler(
      "account.request",
      async ({ currencyIds, drawerConfiguration, areCurrenciesFiltered, useCase }) => {
        tracking.requestAccountRequested(manifest);
        return new Promise((resolve, reject) => {
          let done = false;
          try {
            uiAccountRequest({
              currencyIds,
              drawerConfiguration,
              areCurrenciesFiltered,
              useCase,
              onSuccess: (account: AccountLike, parentAccount: Account | undefined) => {
                if (done) return;
                done = true;
                tracking.requestAccountSuccess(manifest);
                resolve(accountToWalletAPIAccount(walletState, account, parentAccount));
              },
              onCancel: () => {
                if (done) return;
                done = true;
                tracking.requestAccountFail(manifest);
                reject(new Error("Canceled by user"));
              },
            });
          } catch (error) {
            tracking.requestAccountFail(manifest);
            reject(error);
          }
        });
      },
    );
  }, [walletState, manifest, server, tracking, uiAccountRequest]);

  useEffect(() => {
    if (!uiAccountReceive) return;

    server.setHandler("account.receive", ({ accountId, tokenCurrency }) =>
      receiveOnAccountLogic(
        walletState,
        { manifest, accounts, tracking },
        accountId,
        (account, parentAccount, accountAddress) =>
          new Promise((resolve, reject) => {
            let done = false;
            return uiAccountReceive({
              account,
              parentAccount,
              accountAddress,
              onSuccess: accountAddress => {
                if (done) return;
                done = true;
                tracking.receiveSuccess(manifest);
                resolve(accountAddress);
              },
              onCancel: () => {
                if (done) return;
                done = true;
                tracking.receiveFail(manifest);
                reject(new Error("User cancelled"));
              },
              onError: error => {
                if (done) return;
                done = true;
                tracking.receiveFail(manifest);
                reject(error);
              },
            });
          }),
        tokenCurrency,
      ),
    );
  }, [walletState, accounts, manifest, server, tracking, uiAccountReceive]);

  useEffect(() => {
    if (!uiMessageSign) return;

    server.setHandler("message.sign", ({ accountId, message, options }) =>
      signMessageLogic(
        { manifest, accounts, tracking },
        accountId,
        message.toString("hex"),
        (account: AccountLike, message: AnyMessage) =>
          new Promise((resolve, reject) => {
            let done = false;
            return uiMessageSign({
              account,
              message,
              options,
              onSuccess: signature => {
                if (done) return;
                done = true;
                tracking.signMessageSuccess(manifest);
                resolve(
                  signature.startsWith("0x")
                    ? Buffer.from(signature.replace("0x", ""), "hex")
                    : Buffer.from(signature),
                );
              },
              onCancel: () => {
                if (done) return;
                done = true;
                tracking.signMessageFail(manifest);
                reject(new UserRefusedOnDevice());
              },
              onError: error => {
                if (done) return;
                done = true;
                tracking.signMessageFail(manifest);
                reject(error);
              },
            });
          }),
      ),
    );
  }, [accounts, manifest, server, tracking, uiMessageSign]);

  useEffect(() => {
    if (!uiStorageGet) return;

    server.setHandler("storage.get", uiStorageGet);
  }, [server, uiStorageGet]);

  useEffect(() => {
    if (!uiStorageSet) return;

    server.setHandler("storage.set", uiStorageSet);
  }, [server, uiStorageSet]);

  useEffect(() => {
    if (!uiTxSignRaw) return;

    server.setHandler("bitcoin.signPsbt", async ({ accountId, psbt, broadcast }) => {
      const signedOperation = await signRawTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        psbt,
        (account, parentAccount, tx) =>
          new Promise((resolve, reject) => {
            let done = false;
            return uiTxSignRaw({
              account,
              parentAccount,
              transaction: tx,
              options: undefined,
              onSuccess: signedOperation => {
                if (done) return;
                done = true;
                tracking.signRawTransactionSuccess(manifest);
                resolve(signedOperation);
              },
              onError: error => {
                if (done) return;
                done = true;
                tracking.signRawTransactionFail(manifest);
                reject(error);
              },
            });
          }),
      );

      const rawData = signedOperation.rawData;
      if (!rawData || typeof rawData.psbtSigned !== "string") {
        throw new Error("Missing psbtSigned in signed operation rawData");
      }
      const psbtSigned = rawData.psbtSigned;

      if (broadcast) {
        const txHash = await broadcastTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          signedOperation,
          async (account, parentAccount, signedOperation) => {
            const bridge = getAccountBridge(account, parentAccount);
            const mainAccount = getMainAccount(account, parentAccount);

            let optimisticOperation: Operation = signedOperation.operation;

            if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
              try {
                optimisticOperation = await bridge.broadcast({
                  account: mainAccount,
                  signedOperation,
                });
                tracking.broadcastSuccess(manifest);
              } catch (error) {
                tracking.broadcastFail(manifest);
                throw error;
              }
            }

            if (uiTxBroadcast) {
              uiTxBroadcast(account, parentAccount, mainAccount, optimisticOperation);
            }

            return optimisticOperation.hash;
          },
        );

        return { psbtSigned, txHash };
      }

      return { psbtSigned };
    });
  }, [accounts, config.mevProtected, manifest, server, tracking, uiTxBroadcast, uiTxSignRaw]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler(
      "transaction.sign",
      async ({ accountId, tokenCurrency, transaction, options }) => {
        let currency: string | undefined;
        const signedOperation = await signTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          transaction,
          (account, parentAccount, signFlowInfos) => {
            currency =
              account.type === "TokenAccount"
                ? account.token.parentCurrency.id
                : account.currency.id;
            return new Promise((resolve, reject) => {
              let done = false;
              return uiTxSign({
                account,
                parentAccount,
                signFlowInfos,
                options,
                onSuccess: signedOperation => {
                  if (done) return;
                  done = true;
                  tracking.signTransactionSuccess(manifest);
                  resolve(signedOperation);
                },
                onError: error => {
                  if (done) return;
                  done = true;
                  tracking.signTransactionFail(manifest);
                  reject(error);
                },
              });
            });
          },
          tokenCurrency,
        );

        return currency === "solana"
          ? Buffer.from(signedOperation.signature, "hex")
          : Buffer.from(signedOperation.signature);
      },
    );
  }, [accounts, manifest, server, tracking, uiTxSign]);

  useEffect(() => {
    if (!uiTxSignRaw) return;

    server.setHandler(
      "transaction.signRaw",
      async ({ accountId, transaction, broadcast, options }) => {
        const signedOperation = await signRawTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          transaction,
          (account, parentAccount, tx) =>
            new Promise((resolve, reject) => {
              let done = false;
              return uiTxSignRaw({
                account,
                parentAccount,
                transaction: tx,
                options,
                onSuccess: signedOperation => {
                  if (done) return;
                  done = true;
                  tracking.signRawTransactionSuccess(manifest);
                  resolve(signedOperation);
                },
                onError: error => {
                  if (done) return;
                  done = true;
                  tracking.signRawTransactionFail(manifest);
                  reject(error);
                },
              });
            }),
        );

        let hash: string | undefined;
        if (broadcast) {
          hash = await broadcastTransactionLogic(
            { manifest, accounts, tracking },
            accountId,
            signedOperation,
            async (account, parentAccount, signedOperation) => {
              const bridge = getAccountBridge(account, parentAccount);
              const mainAccount = getMainAccount(account, parentAccount);

              let optimisticOperation: Operation = signedOperation.operation;

              if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
                try {
                  optimisticOperation = await bridge.broadcast({
                    account: mainAccount,
                    signedOperation,
                    broadcastConfig: {
                      mevProtected: !!config.mevProtected,
                      source: { type: "live-app", name: manifest.id },
                    },
                  });
                  tracking.broadcastSuccess(manifest);
                } catch (error) {
                  tracking.broadcastFail(manifest);
                  throw error;
                }
              }

              uiTxBroadcast &&
                uiTxBroadcast(account, parentAccount, mainAccount, optimisticOperation);

              return optimisticOperation.hash;
            },
          );
        }

        return {
          signedTransactionHex: signedOperation.signature,
          transactionHash: hash,
        };
      },
    );
  }, [accounts, config.mevProtected, manifest, server, tracking, uiTxBroadcast, uiTxSignRaw]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler(
      "transaction.signAndBroadcast",
      async ({ accountId, tokenCurrency, transaction, options, meta }) => {
        const sponsored = transaction.family === "ethereum" && transaction.sponsored;
        // isEmbedded and partner are passed via meta (not transaction) as they're tracking params, not tx properties
        const isEmbeddedSwap = (meta as { isEmbedded?: boolean } | undefined)?.isEmbedded;
        const partner = (meta as { partner?: string } | undefined)?.partner;

        const signedTransaction = await signTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          transaction,
          (account, parentAccount, signFlowInfos) =>
            new Promise((resolve, reject) => {
              let done = false;
              return uiTxSign({
                account,
                parentAccount,
                signFlowInfos,
                options,
                onSuccess: signedOperation => {
                  if (done) return;
                  done = true;
                  tracking.signTransactionSuccess(manifest, isEmbeddedSwap, partner);
                  resolve(signedOperation);
                },
                onError: error => {
                  if (done) return;
                  done = true;
                  tracking.signTransactionFail(manifest, isEmbeddedSwap, partner);
                  reject(error);
                },
              });
            }),
          tokenCurrency,
          isEmbeddedSwap,
          partner,
        );

        return broadcastTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          signedTransaction,
          async (account, parentAccount, signedOperation) => {
            const bridge = getAccountBridge(account, parentAccount);
            const mainAccount = getMainAccount(account, parentAccount);

            let optimisticOperation: Operation = signedOperation.operation;

            if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
              try {
                optimisticOperation = await bridge.broadcast({
                  account: mainAccount,
                  signedOperation,
                  broadcastConfig: {
                    mevProtected: !!config.mevProtected,
                    sponsored,
                    source: { type: "live-app", name: manifest.id },
                  },
                });
                tracking.broadcastSuccess(manifest, isEmbeddedSwap, partner);
              } catch (error) {
                tracking.broadcastFail(manifest, isEmbeddedSwap, partner);
                throw error;
              }
            }

            uiTxBroadcast &&
              uiTxBroadcast(account, parentAccount, mainAccount, optimisticOperation);

            return optimisticOperation.hash;
          },
          tokenCurrency,
        );
      },
    );
  }, [accounts, config.mevProtected, manifest, server, tracking, uiTxBroadcast, uiTxSign]);

  const onLoad = useCallback(() => {
    tracking.loadSuccess(manifest);
    setWidgetLoaded(true);
  }, [manifest, tracking]);

  const onReload = useCallback(() => {
    tracking.reload(manifest);
    setWidgetLoaded(false);

    webviewHook.reload();
  }, [manifest, tracking, webviewHook]);

  const onLoadError = useCallback(() => {
    tracking.loadFail(manifest);
  }, [manifest, tracking]);

  const device = useDeviceTransport({ manifest, tracking });

  useEffect(() => {
    if (!uiDeviceTransport) return;

    server.setHandler(
      "device.transport",
      ({ appName, appVersionRange, devices }) =>
        new Promise((resolve, reject) => {
          if (device.ref.current) {
            return reject(new Error("Device already opened"));
          }

          tracking.deviceTransportRequested(manifest);

          let done = false;
          return uiDeviceTransport({
            appName,
            onSuccess: ({ device: deviceParam, appAndVersion }) => {
              if (done) return;
              done = true;
              tracking.deviceTransportSuccess(manifest);

              if (!deviceParam) {
                reject(new Error("No device"));
                return;
              }
              if (devices && !devices.includes(deviceParam.modelId)) {
                reject(new Error("Device not in the devices list"));
                return;
              }
              if (
                appVersionRange &&
                appAndVersion &&
                semver.satisfies(appAndVersion.version, appVersionRange)
              ) {
                reject(new Error("App version doesn't satisfies the range"));
                return;
              }
              // TODO handle appFirmwareRange & seeded params
              device.subscribe(deviceParam.deviceId);
              resolve("1");
            },
            onCancel: () => {
              if (done) return;
              done = true;
              tracking.deviceTransportFail(manifest);
              reject(new Error("User cancelled"));
            },
          });
        }),
    );
  }, [device, manifest, server, tracking, uiDeviceTransport]);

  useEffect(() => {
    if (!uiDeviceSelect) return;

    server.setHandler(
      "device.select",
      ({ appName, appVersionRange, devices }) =>
        new Promise((resolve, reject) => {
          if (device.ref.current) {
            return reject(new Error("Device already opened"));
          }

          tracking.deviceSelectRequested(manifest);

          let done = false;
          return uiDeviceSelect({
            appName,
            onSuccess: ({ device: deviceParam, appAndVersion }) => {
              if (done) return;
              done = true;
              tracking.deviceSelectSuccess(manifest);

              if (!deviceParam) {
                reject(new Error("No device"));
                return;
              }
              if (devices && !devices.includes(deviceParam.modelId)) {
                reject(new Error("Device not in the devices list"));
                return;
              }
              if (
                appVersionRange &&
                appAndVersion &&
                semver.satisfies(appAndVersion.version, appVersionRange)
              ) {
                reject(new Error("App version doesn't satisfies the range"));
                return;
              }
              resolve(deviceParam.deviceId);
            },
            onCancel: () => {
              if (done) return;
              done = true;
              tracking.deviceSelectFail(manifest);
              reject(new Error("User cancelled"));
            },
          });
        }),
    );
  }, [device.ref, manifest, server, tracking, uiDeviceSelect]);

  useEffect(() => {
    server.setHandler("device.open", params => {
      if (device.ref.current) {
        return Promise.reject(new Error("Device already opened"));
      }

      tracking.deviceOpenRequested(manifest);

      device.subscribe(params.deviceId);
      return "1";
    });
  }, [device, manifest, server, tracking]);

  useEffect(() => {
    server.setHandler("device.exchange", params => {
      if (!device.ref.current) {
        return Promise.reject(new Error("No device opened"));
      }

      tracking.deviceExchangeRequested(manifest);

      return device.exchange(params);
    });
  }, [device, manifest, server, tracking]);

  useEffect(() => {
    server.setHandler("device.close", ({ transportId }) => {
      if (!device.ref.current) {
        return Promise.reject(new Error("No device opened"));
      }

      tracking.deviceCloseRequested(manifest);

      device.close();

      tracking.deviceCloseSuccess(manifest);

      return Promise.resolve(transportId);
    });
  }, [device, manifest, server, tracking]);

  useEffect(() => {
    server.setHandler("bitcoin.getAddress", ({ accountId, derivationPath }) => {
      return bitcoinFamilyAccountGetAddressLogic(
        { manifest, accounts, tracking },
        accountId,
        derivationPath,
      );
    });
  }, [accounts, manifest, server, tracking]);

  useEffect(() => {
    server.setHandler("bitcoin.getPublicKey", ({ accountId, derivationPath }) => {
      return bitcoinFamilyAccountGetPublicKeyLogic(
        { manifest, accounts, tracking },
        accountId,
        derivationPath,
      );
    });
  }, [accounts, manifest, server, tracking]);

  useEffect(() => {
    server.setHandler("bitcoin.getXPub", ({ accountId }) => {
      return bitcoinFamilyAccountGetXPubLogic({ manifest, accounts, tracking }, accountId);
    });
  }, [accounts, manifest, server, tracking]);

  useEffect(() => {
    if (!uiExchangeStart) {
      return;
    }

    server.setHandler("exchange.start", ({ exchangeType }) => {
      return startExchangeLogic(
        { manifest, accounts, tracking },
        exchangeType,
        exchangeType =>
          new Promise((resolve, reject) => {
            let done = false;
            return uiExchangeStart({
              exchangeType,
              onSuccess: (nonce: string) => {
                if (done) return;
                done = true;
                tracking.startExchangeSuccess(manifest);
                resolve(nonce);
              },
              onCancel: error => {
                if (done) return;
                done = true;
                tracking.completeExchangeFail(manifest);
                reject(error);
              },
            });
          }),
      );
    });
  }, [uiExchangeStart, accounts, manifest, server, tracking]);

  useEffect(() => {
    if (!uiExchangeComplete) {
      return;
    }

    server.setHandler("exchange.complete", params => {
      // retrofit of the exchange params to fit the old platform spec
      const request: CompleteExchangeRequest = {
        provider: params.provider,
        fromAccountId: params.fromAccountId,
        toAccountId: params.exchangeType === "SWAP" ? params.toAccountId : undefined,
        transaction: params.transaction,
        binaryPayload: params.binaryPayload.toString("hex"),
        signature: params.signature.toString("hex"),
        feesStrategy: params.feeStrategy,
        exchangeType: ExchangeType[params.exchangeType],
        swapId: params.exchangeType === "SWAP" ? params.swapId : undefined,
        rate: params.exchangeType === "SWAP" ? params.rate : undefined,
        tokenCurrency: params.exchangeType !== "SELL" ? params.tokenCurrency : undefined,
      };

      return completeExchangeLogic(
        { manifest, accounts, tracking },
        request,
        request =>
          new Promise((resolve, reject) => {
            let done = false;
            return uiExchangeComplete({
              exchangeParams: request,
              onSuccess: (hash: string) => {
                if (done) return;
                done = true;
                tracking.completeExchangeSuccess(manifest);
                resolve(hash);
              },
              onCancel: error => {
                if (done) return;
                done = true;
                tracking.completeExchangeFail(manifest);
                reject(error);
              },
            });
          }),
      );
    });
  }, [uiExchangeComplete, accounts, manifest, server, tracking]);

  return {
    widgetLoaded: widgetLoaded,
    onMessage,
    onLoad,
    onReload,
    onLoadError,
    server,
  };
}

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
  SWAP_NG = 0x03,
  SELL_NG = 0x04,
  FUND_NG = 0x05,
}

export interface Categories {
  categories: string[];
  manifestsByCategories: Map<string, AppManifest[]>;
  selected: string;
  setSelected: (val: string) => void;
  reset: () => void;
}

/** e.g. "all", "restaking", "services", etc */
export type CategoryId = Categories["selected"];

export function useCategories(manifests, initialCategory?: CategoryId | null): Categories {
  const [selected, setSelected] = useState(initialCategory || DISCOVER_INITIAL_CATEGORY);

  const reset = useCallback(() => {
    setSelected(DISCOVER_INITIAL_CATEGORY);
  }, []);

  const manifestsByCategories = useMemo(() => {
    const res = manifests.reduce(
      (res, manifest) => {
        manifest.categories.forEach(category => {
          const list = res.has(category) ? [...res.get(category), manifest] : [manifest];
          res.set(category, list);
        });

        return res;
      },
      new Map().set("all", manifests),
    );

    return res;
  }, [manifests]);

  const categories = useMemo(() => [...manifestsByCategories.keys()], [manifestsByCategories]);

  return useMemo(
    () => ({
      categories,
      manifestsByCategories,
      selected,
      setSelected,
      reset,
    }),
    [categories, manifestsByCategories, selected, reset],
  );
}

export type RecentlyUsedDB = StateDB<DiscoverDB, DiscoverDB["recentlyUsed"]>;
export type CacheBustedLiveAppsdDB = StateDB<DiscoverDB, DiscoverDB["cacheBustedLiveApps"]>;
export type LocalLiveAppDB = StateDB<DiscoverDB, DiscoverDB["localLiveApp"]>;
export type CurrentAccountHistDB = StateDB<DiscoverDB, DiscoverDB["currentAccountHist"]>;

export interface LocalLiveApp {
  state: LiveAppManifest[];
  addLocalManifest: (LiveAppManifest) => void;
  removeLocalManifestById: (string) => void;
  getLocalLiveAppManifestById: (string) => LiveAppManifest | undefined;
}

export function useLocalLiveApp([LocalLiveAppDb, setState]: LocalLiveAppDB): LocalLiveApp {
  useEffect(() => {
    if (LocalLiveAppDb === undefined) {
      setState(discoverDB => {
        return { ...discoverDB, localLiveApp: INITIAL_PLATFORM_STATE.localLiveApp };
      });
    }
  }, [LocalLiveAppDb, setState]);

  const addLocalManifest = useCallback(
    (newLocalManifest: LiveAppManifest) => {
      setState(discoverDB => {
        const newLocalLiveAppList = discoverDB.localLiveApp?.filter(
          manifest => manifest.id !== newLocalManifest.id,
        );

        newLocalLiveAppList.push(newLocalManifest);
        return { ...discoverDB, localLiveApp: newLocalLiveAppList };
      });
    },
    [setState],
  );

  const removeLocalManifestById = useCallback(
    (manifestId: string) => {
      setState(discoverDB => {
        const newLocalLiveAppList = discoverDB.localLiveApp.filter(
          manifest => manifest.id !== manifestId,
        );

        return { ...discoverDB, localLiveApp: newLocalLiveAppList };
      });
    },
    [setState],
  );

  const getLocalLiveAppManifestById = useCallback(
    (manifestId: string): LiveAppManifest | undefined => {
      return LocalLiveAppDb.find(manifest => manifest.id === manifestId);
    },
    [LocalLiveAppDb],
  );

  return {
    state: LocalLiveAppDb,
    addLocalManifest,
    removeLocalManifestById,
    getLocalLiveAppManifestById,
  };
}

export interface RecentlyUsed {
  data: RecentlyUsedManifest[];
  append: (manifest: AppManifest) => void;
  clear: () => void;
}

export type RecentlyUsedManifest = AppManifest & { usedAt: UsedAt };
export type UsedAt = {
  unit?: Intl.RelativeTimeFormatUnit;
  diff: number;
};

function calculateTimeDiff(usedAt: string): UsedAt {
  const start = new Date();
  const end = new Date(usedAt);
  const interval = intervalToDuration({ start, end });
  const units: Intl.RelativeTimeFormatUnit[] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
  ];
  let timeDiff: UsedAt = { unit: undefined, diff: 0 };

  for (const unit of units) {
    if (interval[unit] > 0) {
      timeDiff = { unit, diff: interval[unit] };
      break;
    }
  }

  return timeDiff;
}
export function useCacheBustedLiveApps([cacheBustedLiveAppsDb, setState]: CacheBustedLiveAppsdDB) {
  const getLatest = useCallback(
    (manifestId: string) => {
      return cacheBustedLiveAppsDb?.[manifestId];
    },
    [cacheBustedLiveAppsDb],
  );
  const edit = useCallback(
    (manifestId: string, cacheBustingId: number) => {
      const _cacheBustedLiveAppsDb = {
        ...cacheBustedLiveAppsDb,
        [manifestId]: cacheBustingId,
        init: 1,
      };
      setState(state => {
        const newstate = { ...state, cacheBustedLiveApps: _cacheBustedLiveAppsDb };
        return newstate;
      });
    },
    [setState, cacheBustedLiveAppsDb],
  );
  return { getLatest, edit };
}

export function useRecentlyUsed(
  manifests: AppManifest[],
  [recentlyUsedManifestsDb, setState]: RecentlyUsedDB,
): RecentlyUsed {
  const data = useMemo(
    () =>
      recentlyUsedManifestsDb
        .map(recentlyUsed => {
          const res = manifests.find(manifest => manifest.id === recentlyUsed.id);
          return res
            ? {
                ...res,
                usedAt: calculateTimeDiff(recentlyUsed.usedAt),
              }
            : undefined;
        })
        .filter((manifest): manifest is RecentlyUsedManifest => manifest !== undefined),
    [recentlyUsedManifestsDb, manifests],
  );
  const append = useCallback(
    (manifest: AppManifest) => {
      setState(state => {
        const index = state.recentlyUsed.findIndex(({ id }) => id === manifest.id);

        // Manifest already in first position
        if (index === 0) {
          return {
            ...state,
            recentlyUsed: [
              { ...state.recentlyUsed[0], usedAt: new Date().toISOString() },
              ...state.recentlyUsed.slice(1),
            ],
          };
        }

        // Manifest present we move it to the first position
        // No need to check for MAX_LENGTH as we only move it
        if (index !== -1) {
          return {
            ...state,
            recentlyUsed: [
              { id: manifest.id, usedAt: new Date().toISOString() },
              ...state.recentlyUsed.slice(0, index),
              ...state.recentlyUsed.slice(index + 1),
            ],
          };
        }

        // Manifest not preset we simply append and check for the length
        return {
          ...state,
          recentlyUsed:
            state.recentlyUsed.length >= MAX_RECENTLY_USED_LENGTH
              ? [
                  { id: manifest.id, usedAt: new Date().toISOString() },
                  ...state.recentlyUsed.slice(0, -1),
                ]
              : [{ id: manifest.id, usedAt: new Date().toISOString() }, ...state.recentlyUsed],
        };
      });
    },
    [setState],
  );

  const clear = useCallback(() => {
    setState(state => ({ ...state, recentlyUsed: [] }));
  }, [setState]);

  return { data, append, clear };
}

export interface DisclaimerRaw {
  onConfirm: (manifest: AppManifest, isChecked: boolean) => void;
  onSelect: (manifest: AppManifest) => void;
}

interface DisclaimerUiHook {
  prompt: (
    manifest: AppManifest,
    onContinue: (manifest: AppManifest, isChecked: boolean) => void,
  ) => void;
  dismiss: () => void;
  openApp: (manifest: AppManifest) => void;
  close: () => void;
}

export function useDisclaimerRaw({
  isReadOnly = false,
  isDismissed,
  uiHook,
  appendRecentlyUsed,
}: {
  // used only on mobile for now
  isReadOnly?: boolean;
  isDismissed: boolean;
  appendRecentlyUsed: (manifest: AppManifest) => void;
  uiHook: DisclaimerUiHook;
}): DisclaimerRaw {
  const onConfirm = useCallback(
    (manifest: AppManifest, isChecked: boolean) => {
      if (!manifest) return;

      if (isChecked) {
        uiHook.dismiss();
      }

      uiHook.close();
      appendRecentlyUsed(manifest);
      uiHook.openApp(manifest);
    },
    [uiHook, appendRecentlyUsed],
  );

  const onSelect = useCallback(
    (manifest: AppManifest) => {
      if (manifest.branch === "soon") {
        return;
      }

      if (!isDismissed && !isReadOnly && manifest.author !== "ledger") {
        uiHook.prompt(manifest, onConfirm);
      } else {
        appendRecentlyUsed(manifest);
        uiHook.openApp(manifest);
      }
    },
    [isReadOnly, isDismissed, uiHook, appendRecentlyUsed, onConfirm],
  );

  return {
    onSelect,
    onConfirm,
  };
}
