import { useMemo, useState, useEffect, useRef, useCallback, RefObject } from "react";
import semver from "semver";
import { intervalToDuration } from "date-fns";

import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletHandlers, ServerConfig, WalletAPIServer } from "@ledgerhq/wallet-api-server";
import { useWalletAPIServer as useWalletAPIServerRaw } from "@ledgerhq/wallet-api-server/lib/react";
import { Transport, Permission } from "@ledgerhq/wallet-api-core";
import { StateDB } from "../hooks/useDBRaw";
import { Observable, firstValueFrom, Subject } from "rxjs";
import { first } from "rxjs/operators";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
  getAccountIdFromWalletAccountId,
} from "./converters";
import { isWalletAPISupportedCurrency } from "./helpers";
import { WalletAPICurrency, AppManifest, WalletAPIAccount, WalletAPICustomHandlers } from "./types";
import { getMainAccount, getParentAccount } from "../account";
import {
  listCurrencies,
  findCryptoCurrencyById,
  findTokenById,
  getCryptoCurrencyById,
} from "../currencies";
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
} from "./logic";
import { getAccountBridge } from "../bridge";
import { getEnv } from "@ledgerhq/live-env";
import openTransportAsSubject, { BidirectionalEvent } from "../hw/openTransportAsSubject";
import { AppResult } from "../hw/actions/app";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Transaction } from "../generated/types";
import {
  DISCOVER_INITIAL_CATEGORY,
  INITIAL_PLATFORM_STATE,
  MAX_RECENTLY_USED_LENGTH,
} from "./constants";
import { DiscoverDB } from "./types";
import { LiveAppManifest } from "../platform/types";
import { WalletState } from "@ledgerhq/live-wallet/store";

export function safeGetRefValue<T>(ref: RefObject<T>): NonNullable<T> {
  if (!ref.current) {
    throw new Error("Ref objects doesn't have a current value");
  }
  return ref.current;
}

export function useWalletAPIAccounts(
  walletState: WalletState,
  accounts: AccountLike[],
): WalletAPIAccount[] {
  return useMemo(() => {
    return accounts.map(account => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToWalletAPIAccount(walletState, account, parentAccount);
    });
  }, [walletState, accounts]);
}

export function useWalletAPICurrencies(): WalletAPICurrency[] {
  return useMemo(() => {
    return listCurrencies(true).reduce<WalletAPICurrency[]>((filtered, currency) => {
      if (isWalletAPISupportedCurrency(currency)) {
        filtered.push(currencyToWalletAPICurrency(currency));
      }
      return filtered;
    }, []);
  }, []);
}

export function useManifestCurrencies(manifest: AppManifest) {
  return useMemo(() => {
    return (
      manifest.dapp?.networks.map(network => {
        return getCryptoCurrencyById(network.currency);
      }) ?? []
    );
  }, [manifest.dapp?.networks]);
}

export function useGetAccountIds(
  accounts$: Observable<WalletAPIAccount[]> | undefined,
): Map<string, boolean> | undefined {
  const [accounts, setAccounts] = useState<WalletAPIAccount[]>([]);

  useEffect(() => {
    if (!accounts$) {
      return undefined;
    }

    const subscription = accounts$.subscribe(walletAccounts => {
      setAccounts(walletAccounts);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [accounts$]);

  return useMemo(() => {
    if (!accounts$) {
      return undefined;
    }

    return accounts.reduce((accountIds, account) => {
      accountIds.set(getAccountIdFromWalletAccountId(account.id), true);
      return accountIds;
    }, new Map());
  }, [accounts, accounts$]);
}

export interface UiHook {
  "account.request": (params: {
    accounts$?: Observable<WalletAPIAccount[]>;
    currencies: CryptoOrTokenCurrency[];
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
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "storage.get": WalletHandlers["storage.get"];
  "storage.set": WalletHandlers["storage.set"];
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

export function usePermission(manifest: AppManifest): Permission {
  return useMemo(
    () => ({
      currencyIds: manifest.currencies === "*" ? ["**"] : manifest.currencies,
      methodIds: manifest.permissions as unknown as string[], // TODO remove when using the correct manifest type
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

export function useConfig({ appId, userId, tracking, wallet }: ServerConfig): ServerConfig {
  return useMemo(
    () => ({
      appId,
      userId,
      tracking,
      wallet,
    }),
    [appId, tracking, userId, wallet],
  );
}

function useDeviceTransport({ manifest, tracking }) {
  const ref = useRef<Subject<BidirectionalEvent> | undefined>();

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
  const permission = usePermission(manifest);
  const transport = useTransport(webviewHook.postMessage);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const walletAPIAccounts = useWalletAPIAccounts(walletState, accounts);
  const walletAPICurrencies = useWalletAPICurrencies();

  const { server, onMessage } = useWalletAPIServerRaw({
    transport,
    config,
    accounts: walletAPIAccounts,
    currencies: walletAPICurrencies,
    permission,
    customHandlers,
  });

  useEffect(() => {
    tracking.load(manifest);
  }, [tracking, manifest]);

  useEffect(() => {
    if (!uiAccountRequest) return;

    server.setHandler("account.request", async ({ accounts$, currencies$ }) => {
      tracking.requestAccountRequested(manifest);
      const currencies = await firstValueFrom(currencies$);

      return new Promise((resolve, reject) => {
        // handle no curencies selected case
        const currencyList = currencies.reduce<CryptoOrTokenCurrency[]>((prev, { id }) => {
          const currency = findCryptoCurrencyById(id) || findTokenById(id);
          if (currency) {
            prev.push(currency);
          }
          return prev;
        }, []);

        let done = false;
        uiAccountRequest({
          accounts$,
          currencies: currencyList,
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
      });
    });
  }, [walletState, manifest, server, tracking, uiAccountRequest]);

  useEffect(() => {
    if (!uiAccountReceive) return;

    server.setHandler("account.receive", ({ account, tokenCurrency }) =>
      receiveOnAccountLogic(
        walletState,
        { manifest, accounts, tracking },
        account.id,
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

    server.setHandler("message.sign", ({ account, message }) =>
      signMessageLogic(
        { manifest, accounts, tracking },
        account.id,
        message.toString("hex"),
        (account: AccountLike, message: AnyMessage) =>
          new Promise((resolve, reject) => {
            let done = false;
            return uiMessageSign({
              account,
              message,
              onSuccess: signature => {
                if (done) return;
                done = true;
                tracking.signMessageSuccess(manifest);
                resolve(Buffer.from(signature.replace("0x", ""), "hex"));
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
    if (!uiTxSign) return;

    server.setHandler(
      "transaction.sign",
      async ({ account, tokenCurrency, transaction, options }) => {
        const signedOperation = await signTransactionLogic(
          { manifest, accounts, tracking },
          account.id,
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
            }),
          tokenCurrency,
        );

        return Buffer.from(signedOperation.signature);
      },
    );
  }, [accounts, manifest, server, tracking, uiTxSign]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler(
      "transaction.signAndBroadcast",
      async ({ account, tokenCurrency, transaction, options }) => {
        const signedTransaction = await signTransactionLogic(
          { manifest, accounts, tracking },
          account.id,
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
            }),
          tokenCurrency,
        );

        return broadcastTransactionLogic(
          { manifest, accounts, tracking },
          account.id,
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
          tokenCurrency,
        );
      },
    );
  }, [accounts, manifest, server, tracking, uiTxBroadcast, uiTxSign]);

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
        fromAccountId: params.fromAccount.id,
        toAccountId: params.exchangeType === "SWAP" ? params.toAccount.id : undefined,
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
    widgetLoaded,
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
  unit: Intl.RelativeTimeFormatUnit;
  diff: number;
};

function calculateTimeDiff(usedAt: string) {
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
  let timeDiff = { unit: units[-1], diff: 0 };

  for (const unit of units) {
    if (interval[unit] > 0) {
      timeDiff = { unit, diff: interval[unit] };
      break;
    }
  }

  return timeDiff;
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
            : res;
        })
        .filter(manifest => manifest !== undefined) as RecentlyUsedManifest[],
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
