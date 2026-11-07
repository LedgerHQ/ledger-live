import { useMemo, useState, useEffect, useCallback, RefObject } from "react";
import { useDispatch } from "react-redux";
import { intervalToDuration } from "date-fns";
import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import { WalletHandlers, ServerConfig, WalletAPIServer } from "@ledgerhq/wallet-api-server";
import { getEnv } from "@shared/env";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { type AccountNamesState } from "@domain/entity-account-name";
import { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { StateDB } from "../hooks/useDBRaw";
import { useFeatureFlags } from "@features/platform-feature-flags";
import type { Feature, FeatureId } from "@shared/feature-flags";
import {
  accountToWalletAPIAccount,
  getAccountIdFromWalletAccountId,
  setWalletApiIdForAccountId,
  resolveWalletApiSpendableBalance,
  resolveWalletApiMaxSpendable,
} from "./converters";
import { AccountPublicKeyUnavailable, SignPsbtAppNotAllowed } from "../errors";
import { isBitcoinSignPsbtOptionsAllowed, isWalletAPISupportedCurrency } from "./helpers";
import { AppManifest, WalletAPIAccount, WalletAPICustomHandlers, DiscoverDB } from "./types";
import { getMainAccount, getParentAccount } from "../account";
import { listSupportedCurrencies } from "../currencies";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
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
  bitcoinFamilyAccountGetAddressesLogic,
  accountGetPublicKeyLogic,
  bitcoinFamilyAccountGetPublicKeyLogic,
  signRawTransactionLogic,
} from "./logic";
import { handlers as featureFlagsHandlers } from "./FeatureFlags";
import { getAccountBridge } from "../bridge";

import openTransportAsSubject from "../hw/openTransportAsSubject";
import { AppResult } from "../hw/actions/app";
import { Transaction } from "../coin-modules/transaction-types";
import {
  DISCOVER_INITIAL_CATEGORY,
  INITIAL_PLATFORM_STATE,
  MAX_RECENTLY_USED_LENGTH,
} from "./constants";
import { LiveAppManifest } from "../platform/types";
import { ModularDrawerConfiguration } from "./ModularDrawer/types";
import { useCurrenciesUnderFeatureFlag } from "../modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { bindUiFlowToSession, type BridgeSession } from "./bridgeSession";
import type { WalletAPIAccountsProvider } from "@features/platform-wallet-api-accounts";
import {
  accountFilterOf,
  effectiveCurrencyIds,
  fetchWalletAPICurrencies,
  setHandlers,
  useAccountDataHandlers,
  useDeviceHandlers,
  useWalletAPIServerCore,
  type OpenDeviceTransport,
  type AccountDataUiHook,
} from "@features/platform-wallet-api-server";

const openDevice: OpenDeviceTransport = deviceId => openTransportAsSubject({ deviceId });

export function safeGetRefValue<T>(ref: RefObject<T>): NonNullable<T> {
  if (!ref.current) {
    throw new Error("Ref objects doesn't have a current value");
  }
  return ref.current;
}

/** The provider's account, or `undefined` for the legacy conversion to answer, the provider failing included. */
async function fromAccountsProvider(
  accountsProvider: WalletAPIAccountsProvider | undefined,
  legacyId: string,
): Promise<WalletAPIAccount | undefined> {
  try {
    return await accountsProvider?.fromLegacyAccountId(legacyId);
  } catch {
    return undefined;
  }
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
    uiUseCase?: string;
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
  // account.getPublicKey has no usable public key (e.g. a Tezos account that must be re-added).
  // The RPC still rejects; this only surfaces a native message to the user.
  "account.publicKeyUnavailable": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
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
    broadcast?: boolean;
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
  }) => void | Promise<void>;
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

/**
 * The promise of a UI flow opened for a request: it also rejects once the session is closed, as
 * the callbacks of the flow are dropped then (`bindUiFlowToSession`). A signing flow awaits it
 * in `withLiveAppContext`, which can then restore the previous signing attribution.
 */
function sessionPromise<T>(
  session: BridgeSession,
  executor: (resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  return session.cancelOnClose(new Promise<T>(executor));
}

function useSessionUiFlow<P extends object, R>(
  session: BridgeSession,
  open: ((params: P) => R) | undefined,
): ((params: P) => R | undefined) | undefined {
  return useMemo(() => open && bindUiFlowToSession(session, open), [session, open]);
}

/**
 * The UI hooks of the dapp logic, bound to the session of the request: a request still preparing
 * when its session is closed (e.g. personal_sign) opens no UI, and its callbacks are dropped.
 */
export function useDappSessionUiHook(session: BridgeSession, uiHook: UiHook): UiHook {
  return useMemo(() => {
    const bind =
      <P extends object>(open: (params: P) => void) =>
      (params: P): void => {
        bindUiFlowToSession(session, open)(params);
      };
    return {
      ...uiHook,
      "account.request": bind(uiHook["account.request"]),
      "message.sign": bind(uiHook["message.sign"]),
      "transaction.sign": bind(uiHook["transaction.sign"]),
    };
  }, [session, uiHook]);
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

export type useWalletAPIServerOptions = {
  accountNames: AccountNamesState;
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
  config: ServerConfig;
  webviewHook: {
    reload: () => void;
  };
  /**
   * Transport of the server: one server runs per session, i.e. per main-frame origin.
   * The webview host feeds it the messages it accepted (see `useBridgeSession`).
   */
  bridgeSession: BridgeSession;
  uiHook: Partial<UiHook>;
  customHandlers?: WalletAPICustomHandlers;
  /** Serves `account.list` and `account.request` from the account data entities instead of `accounts`. */
  accountsProvider?: WalletAPIAccountsProvider;
  /** With `accountsProvider`, the screens the account data handlers open (signing a prepared send). */
  accountDataUiHook?: AccountDataUiHook;
};

export { TOKEN_LOOKUP_CONCURRENCY } from "@features/platform-wallet-api-server";

export function useWalletAPIServer({
  accountNames,
  manifest,
  accounts,
  tracking,
  config,
  webviewHook,
  uiHook,
  customHandlers,
  bridgeSession,
  accountsProvider,
  accountDataUiHook = {},
}: useWalletAPIServerOptions): {
  server: WalletAPIServer;
  onLoad: () => void;
  onReload: () => void;
  onLoadError: () => void;
  widgetLoaded: boolean;
} {
  const {
    "storage.get": uiStorageGet,
    "storage.set": uiStorageSet,
    "transaction.broadcast": uiTxBroadcast,
  } = uiHook;
  const storage = useMemo(
    () => ({ "storage.get": uiStorageGet, "storage.set": uiStorageSet }),
    [uiStorageGet, uiStorageSet],
  );
  const uiAccountRequest = useSessionUiFlow(bridgeSession, uiHook["account.request"]);
  const uiAccountReceive = useSessionUiFlow(bridgeSession, uiHook["account.receive"]);
  const uiAccountPublicKeyUnavailable = useSessionUiFlow(
    bridgeSession,
    uiHook["account.publicKeyUnavailable"],
  );
  const uiMessageSign = useSessionUiFlow(bridgeSession, uiHook["message.sign"]);
  const uiTxSign = useSessionUiFlow(bridgeSession, uiHook["transaction.sign"]);
  const uiTxSignRaw = useSessionUiFlow(bridgeSession, uiHook["transaction.signRaw"]);
  const uiDeviceTransport = useSessionUiFlow(bridgeSession, uiHook["device.transport"]);
  const uiDeviceSelect = useSessionUiFlow(bridgeSession, uiHook["device.select"]);
  const uiExchangeStart = useSessionUiFlow(bridgeSession, uiHook["exchange.start"]);
  const uiExchangeComplete = useSessionUiFlow(bridgeSession, uiHook["exchange.complete"]);

  // Enables the proper typing on dispatch with RTK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const flags = useFeatureFlags();
  const getFeature = useCallback((id: FeatureId): Feature | null => flags[id] ?? null, [flags]);
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

  const accountDataContext = useMemo(
    () => ({ session: bridgeSession, manifestId: manifest.id, mevProtected: config.mevProtected }),
    [bridgeSession, manifest.id, config.mevProtected],
  );
  const accountDataHandlers = useAccountDataHandlers(
    dispatch,
    accountDataUiHook,
    accountDataContext,
  );
  const { server, setHandler } = useWalletAPIServerCore({
    session: bridgeSession,
    manifest,
    config,
    customHandlers: mergedCustomHandlers,
    storage,
    accountsProvider,
    accountDataHandlers: accountsProvider ? accountDataHandlers : undefined,
  });

  useEffect(() => {
    tracking.load(manifest);
  }, [tracking, manifest.id]);

  // TODO: refactor each handler into its own logic function for clarity
  useEffect(() => {
    setHandler("currency.list", ({ currencyIds }) =>
      dispatch(
        fetchWalletAPICurrencies({
          manifestCurrencies: manifest.currencies,
          currencyIds,
          supportedCurrencies: listSupportedCurrencies().filter(
            c => isWalletAPISupportedCurrency(c) && !deactivatedCurrencyIds.has(c.id),
          ),
          findTokenById: id => getCryptoAssetsStore().findTokenById(id),
        }),
      ),
    );
  }, [manifest.currencies, setHandler, dispatch, deactivatedCurrencyIds]);

  useEffect(() => {
    setHandler("account.list", async ({ currencyIds }) => {
      const isAllowed = accountFilterOf(effectiveCurrencyIds(manifest.currencies, currencyIds));
      const filteredAccounts = accounts.filter(account =>
        account.type === "TokenAccount"
          ? isAllowed(account.token.id, account.token.parentCurrencyId)
          : isAllowed(account.currency.id, account.currency.id),
      );

      const wapiAccounts = await Promise.all(
        filteredAccounts.map(async (account): Promise<WalletAPIAccount> => {
          const parentAccount = getParentAccount(account, accounts);
          const spendableBalance = await resolveWalletApiSpendableBalance(account, parentAccount);

          return {
            ...accountToWalletAPIAccount(accountNames, account, parentAccount),
            spendableBalance,
          };
        }),
      );

      return wapiAccounts;
    });
  }, [accountNames, manifest, setHandler, accounts]);

  useEffect(() => {
    if (!uiAccountRequest) return;

    setHandler(
      "account.request",
      async ({ currencyIds, drawerConfiguration, areCurrenciesFiltered, useCase, uiUseCase }) => {
        tracking.requestAccountRequested(manifest);
        return new Promise((resolve, reject) => {
          let done = false;
          try {
            uiAccountRequest({
              currencyIds,
              drawerConfiguration,
              areCurrenciesFiltered,
              useCase,
              uiUseCase,
              onSuccess: async (account: AccountLike, parentAccount: Account | undefined) => {
                if (done) return;
                done = true;
                try {
                  const fromEntities = await fromAccountsProvider(accountsProvider, account.id);
                  if (fromEntities) {
                    tracking.requestAccountSuccess(manifest);
                    resolve(fromEntities);
                    return;
                  }
                  const spendableBalance = await resolveWalletApiSpendableBalance(
                    account,
                    parentAccount,
                  );

                  tracking.requestAccountSuccess(manifest);
                  resolve({
                    ...accountToWalletAPIAccount(accountNames, account, parentAccount),
                    spendableBalance,
                  });
                } catch (error) {
                  tracking.requestAccountFail(manifest);
                  reject(error);
                }
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
  }, [accountNames, manifest, setHandler, tracking, uiAccountRequest, accountsProvider]);

  useEffect(() => {
    if (!uiAccountReceive) return;

    setHandler("account.receive", ({ accountId, tokenCurrency }) =>
      receiveOnAccountLogic(
        accountNames,
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
  }, [accountNames, accounts, manifest, setHandler, tracking, uiAccountReceive]);

  useEffect(() => {
    if (!uiMessageSign) return;

    setHandler("message.sign", ({ accountId, message, options }) =>
      signMessageLogic(
        { manifest, accounts, tracking },
        accountId,
        message.toString("hex"),
        (account: AccountLike, message: AnyMessage) =>
          sessionPromise(bridgeSession, (resolve, reject) => {
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
  }, [bridgeSession, accounts, manifest, setHandler, tracking, uiMessageSign]);

  useEffect(() => {
    if (!uiTxSignRaw) return;

    setHandler("bitcoin.signPsbt", async ({ accountId, psbt, broadcast, options }) => {
      const signedOperation = await signRawTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        psbt,
        (account, parentAccount, tx) =>
          sessionPromise(bridgeSession, (resolve, reject) => {
            const { currency } = getMainAccount(account, parentAccount);
            if (!isBitcoinSignPsbtOptionsAllowed(currency, options)) {
              tracking.signRawTransactionFail(manifest);
              reject(
                new SignPsbtAppNotAllowed(
                  `Device app "${options?.hwAppId}" is not allowed for ${currency.id}`,
                ),
              );
              return;
            }
            let done = false;
            return uiTxSignRaw({
              account,
              parentAccount,
              transaction: tx,
              broadcast,
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
            const bridge = await getAccountBridge(account, parentAccount);
            // The main frame may have moved to another origin while the bridge was prepared.
            bridgeSession.assertOpen();
            const mainAccount = getMainAccount(account, parentAccount);

            let optimisticOperation: Operation = signedOperation.operation;

            const networkId =
              account.type === "TokenAccount"
                ? account.token.parentCurrencyId
                : account.currency.id;

            const broadcastTrackingData = {
              sourceCurrency:
                account.type === "TokenAccount" ? account.token.name : account.currency.name,
              network: networkId,
            };

            if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
              try {
                optimisticOperation = await bridge.broadcast({
                  account: mainAccount,
                  signedOperation,
                });
                tracking.broadcastSuccess(manifest, broadcastTrackingData);
              } catch (error) {
                tracking.broadcastFail(manifest, broadcastTrackingData);
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
  }, [
    bridgeSession,
    accounts,
    config.mevProtected,
    manifest,
    setHandler,
    tracking,
    uiTxBroadcast,
    uiTxSignRaw,
  ]);

  useEffect(() => {
    if (!uiTxSign) return;

    setHandler("transaction.sign", async ({ accountId, tokenCurrency, transaction, options }) => {
      let family: string | undefined;
      const signedOperation = await signTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        transaction,
        (account, parentAccount, signFlowInfos) => {
          family = getMainAccount(account, parentAccount).currency.family;
          return sessionPromise(bridgeSession, (resolve, reject) => {
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

      return family === "solana"
        ? Buffer.from(signedOperation.signature, "base64")
        : Buffer.from(signedOperation.signature);
    });
  }, [bridgeSession, accounts, manifest, setHandler, tracking, uiTxSign]);

  useEffect(() => {
    if (!uiTxSignRaw) return;

    setHandler("transaction.signRaw", async ({ accountId, transaction, broadcast, options }) => {
      let family: string | undefined;
      const signedOperation = await signRawTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        transaction,
        (account, parentAccount, tx) =>
          sessionPromise(bridgeSession, (resolve, reject) => {
            family = getMainAccount(account, parentAccount).currency.family;
            let done = false;
            return uiTxSignRaw({
              account,
              parentAccount,
              transaction: tx,
              broadcast,
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
            const bridge = await getAccountBridge(account, parentAccount);
            // The main frame may have moved to another origin while the bridge was prepared.
            bridgeSession.assertOpen();
            const mainAccount = getMainAccount(account, parentAccount);

            const networkId =
              account.type === "TokenAccount"
                ? account.token.parentCurrencyId
                : account.currency.id;

            const broadcastTrackingData = {
              sourceCurrency:
                account.type === "TokenAccount" ? account.token.name : account.currency.name,
              network: networkId,
            };

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
                tracking.broadcastSuccess(manifest, broadcastTrackingData);
              } catch (error) {
                tracking.broadcastFail(manifest, broadcastTrackingData);
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
        // Consumers decode `signedTransactionHex` as hex; `combine` returns base64.
        signedTransactionHex:
          family === "solana"
            ? Buffer.from(signedOperation.signature, "base64").toString("hex")
            : signedOperation.signature,
        transactionHash: hash,
      };
    });
  }, [
    bridgeSession,
    accounts,
    config.mevProtected,
    manifest,
    setHandler,
    tracking,
    uiTxBroadcast,
    uiTxSignRaw,
  ]);

  useEffect(() => {
    if (!uiTxSign) return;

    setHandler(
      "transaction.signAndBroadcast",
      async ({ accountId, tokenCurrency, transaction, options, meta }) => {
        const sponsored = transaction.family === "ethereum" && transaction.sponsored;
        // isEmbedded, partner and swapEntryPoint are passed via meta (not transaction) as they're tracking params, not tx properties
        const isEmbeddedSwap = (meta as { isEmbedded?: boolean } | undefined)?.isEmbedded;
        const partner = (meta as { partner?: string } | undefined)?.partner;
        const swapEntryPoint = (meta as { swapEntryPoint?: string } | undefined)?.swapEntryPoint;

        const signedTransaction = await signTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          transaction,
          (account, parentAccount, signFlowInfos) =>
            sessionPromise(bridgeSession, (resolve, reject) => {
              let done = false;
              return uiTxSign({
                account,
                parentAccount,
                signFlowInfos,
                options,
                onSuccess: signedOperation => {
                  if (done) return;
                  done = true;
                  tracking.signTransactionSuccess(
                    manifest,
                    isEmbeddedSwap,
                    partner,
                    swapEntryPoint,
                  );
                  resolve(signedOperation);
                },
                onError: error => {
                  if (done) return;
                  done = true;
                  tracking.signTransactionFail(manifest, isEmbeddedSwap, partner, swapEntryPoint);
                  reject(error);
                },
              });
            }),
          tokenCurrency,
          isEmbeddedSwap,
          partner,
          swapEntryPoint,
        );

        return broadcastTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          signedTransaction,
          async (account, parentAccount, signedOperation) => {
            const bridge = await getAccountBridge(account, parentAccount);
            // The main frame may have moved to another origin while the bridge was prepared.
            bridgeSession.assertOpen();
            const mainAccount = getMainAccount(account, parentAccount);

            const networkId =
              account.type === "TokenAccount"
                ? account.token.parentCurrencyId
                : account.currency.id;

            const broadcastTrackingData = {
              isEmbeddedSwap,
              swapEntryPoint,
              partner,
              sourceCurrency:
                account.type === "TokenAccount" ? account.token.name : account.currency.name,
              network: networkId,
            };

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
                tracking.broadcastSuccess(manifest, broadcastTrackingData);
              } catch (error) {
                tracking.broadcastFail(manifest, broadcastTrackingData);
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
  }, [
    bridgeSession,
    accounts,
    config.mevProtected,
    manifest,
    setHandler,
    tracking,
    uiTxBroadcast,
    uiTxSign,
  ]);

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

  const deviceHandlers = useDeviceHandlers({
    session: bridgeSession,
    manifest,
    tracking,
    openDevice,
    pickers: { "device.transport": uiDeviceTransport, "device.select": uiDeviceSelect },
  });

  useEffect(() => {
    setHandlers(setHandler, deviceHandlers);
  }, [deviceHandlers, setHandler]);

  useEffect(() => {
    setHandler("bitcoin.getAddress", ({ accountId, derivationPath }) => {
      return bitcoinFamilyAccountGetAddressLogic(
        { manifest, accounts, tracking },
        accountId,
        derivationPath,
      );
    });
  }, [accounts, manifest, setHandler, tracking]);

  useEffect(() => {
    setHandler("bitcoin.getAddresses", ({ accountId, intentions }) => {
      return bitcoinFamilyAccountGetAddressesLogic(
        { manifest, accounts, tracking },
        accountId,
        intentions,
      );
    });
  }, [accounts, manifest, setHandler, tracking]);

  useEffect(() => {
    setHandler("bitcoin.getPublicKey", ({ accountId, derivationPath }) => {
      return bitcoinFamilyAccountGetPublicKeyLogic(
        { manifest, accounts, tracking },
        accountId,
        derivationPath,
      );
    });
  }, [accounts, manifest, setHandler, tracking]);

  useEffect(() => {
    setHandler("account.getMaxSpendable", async ({ accountId }) => {
      const localAccountId = getAccountIdFromWalletAccountId(accountId);
      if (!localAccountId) {
        throw new Error(`accountId ${accountId} unknown`);
      }

      const account = accounts.find(item => item.id === localAccountId);
      if (!account) {
        throw new Error("account not found");
      }

      const parentAccount = getParentAccount(account, accounts);
      const maxSpendable = await resolveWalletApiMaxSpendable(account, parentAccount);
      if (maxSpendable === undefined) {
        throw new Error("account.getMaxSpendable failed");
      }

      return maxSpendable.toFixed(0);
    });
  }, [accounts, setHandler]);

  useEffect(() => {
    setHandler("account.getPublicKey", async ({ accountId }) => {
      try {
        return await accountGetPublicKeyLogic({ manifest, accounts, tracking }, accountId);
      } catch (error) {
        // Surface a native message, then let the RPC reject as before. Match by name (not just
        // instanceof, per createCustomErrorClass) so it holds even if the error loses its
        // prototype (e.g. serialized to a plain object across a transport).
        const isPublicKeyUnavailable =
          error instanceof AccountPublicKeyUnavailable ||
          (typeof error === "object" &&
            error !== null &&
            (error as { name?: unknown }).name === "AccountPublicKeyUnavailable");
        if (isPublicKeyUnavailable && uiAccountPublicKeyUnavailable) {
          try {
            const localAccountId = getAccountIdFromWalletAccountId(accountId);
            const account = localAccountId
              ? accounts.find(a => a.id === localAccountId)
              : undefined;
            if (account) {
              uiAccountPublicKeyUnavailable({
                account,
                // getParentAccount returns the account itself for a main account; a real parent
                // only exists for token accounts.
                parentAccount:
                  account.type === "TokenAccount" ? getParentAccount(account, accounts) : undefined,
              });
            }
          } catch {
            // Best-effort native prompt: never let a UI failure replace the original RPC rejection.
          }
        }
        throw error;
      }
    });
  }, [accounts, manifest, setHandler, tracking, uiAccountPublicKeyUnavailable]);

  useEffect(() => {
    setHandler("bitcoin.getXPub", ({ accountId }) => {
      return bitcoinFamilyAccountGetXPubLogic({ manifest, accounts, tracking }, accountId);
    });
  }, [accounts, manifest, setHandler, tracking]);

  useEffect(() => {
    if (!uiExchangeStart) {
      return;
    }

    setHandler("exchange.start", ({ exchangeType }) => {
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
  }, [uiExchangeStart, accounts, manifest, setHandler, tracking]);

  useEffect(() => {
    if (!uiExchangeComplete) {
      return;
    }

    setHandler("exchange.complete", params => {
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
  }, [uiExchangeComplete, accounts, manifest, setHandler, tracking]);

  return {
    widgetLoaded: widgetLoaded,
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
export type SetCurrentAccountHistDb = CurrentAccountHistDB[1];

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
