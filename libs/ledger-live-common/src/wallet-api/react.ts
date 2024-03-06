import { useMemo, useState, useEffect, useRef, useCallback, RefObject } from "react";
import semver from "semver";
import { intervalToDuration } from "date-fns";
import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletHandlers, ServerConfig, WalletAPIServer } from "@ledgerhq/wallet-api-server";
import { useWalletAPIServer as useWalletAPIServerRaw } from "@ledgerhq/wallet-api-server/lib/react";
import {
  ServerError,
  createCurrencyNotFound,
  Transport,
  Permission,
} from "@ledgerhq/wallet-api-core";
import { StateDB } from "../hooks/useDBRaw";
import { Observable, firstValueFrom, Subject } from "rxjs";
import { first } from "rxjs/operators";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
  getAccountIdFromWalletAccountId,
} from "./converters";
import { isWalletAPISupportedCurrency } from "./helpers";
import {
  WalletAPICurrency,
  AppManifest,
  WalletAPIAccount,
  WalletAPICustomHandlers,
  WalletAPITransaction,
} from "./types";
import { getMainAccount, getParentAccount } from "../account";
import { listCurrencies, findCryptoCurrencyById, findTokenById } from "../currencies";
import { TrackingAPI } from "./tracking";
import {
  bitcoinFamillyAccountGetXPubLogic,
  broadcastTransactionLogic,
  startExchangeLogic,
  completeExchangeLogic,
  CompleteExchangeRequest,
  CompleteExchangeUiRequest,
  receiveOnAccountLogic,
  signMessageLogic,
  signTransactionLogic,
} from "./logic";
import { getAccountBridge } from "../bridge";
import { getEnv } from "@ledgerhq/live-env";
import openTransportAsSubject, { BidirectionalEvent } from "../hw/openTransportAsSubject";
import { AppResult } from "../hw/actions/app";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Transaction } from "../generated/types";
import { DISCOVER_INITIAL_CATEGORY, MAX_RECENTLY_USED_LENGTH } from "./constants";
import { DiscoverDB } from "./types";
import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { safeEncodeEIP55 } from "@ledgerhq/coin-evm/logic";
import { getWalletAPITransactionSignFlowInfos } from "./converters";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies/index";
import { prepareMessageToSign } from "../hw/signMessage/index";

export function safeGetRefValue<T>(ref: RefObject<T>): NonNullable<T> {
  if (!ref.current) {
    throw new Error("Ref objects doesn't have a current value");
  }
  return ref.current;
}

export function useWalletAPIAccounts(accounts: AccountLike[]): WalletAPIAccount[] {
  return useMemo(() => {
    return accounts.map(account => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToWalletAPIAccount(account, parentAccount);
    });
  }, [accounts]);
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

function usePermission(manifest: AppManifest): Permission {
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

const allCurrenciesAndTokens = listCurrencies(true);

export type useWalletAPIServerOptions = {
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

  const walletAPIAccounts = useWalletAPIAccounts(accounts);
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
        const currencyIds = currencies.map(({ id }) => id);

        let currencyList: CryptoOrTokenCurrency[] = [];
        // if single currency available redirect to select account directly
        if (currencyIds.length === 1) {
          const currency = findCryptoCurrencyById(currencyIds[0]) || findTokenById(currencyIds[0]);
          if (currency) {
            currencyList = [currency];
          }

          if (!currencyList[0]) {
            tracking.requestAccountFail(manifest);
            // @TODO replace with correct error
            reject(new ServerError(createCurrencyNotFound(currencyIds[0])));
          }
        } else {
          currencyList = allCurrenciesAndTokens.filter(({ id }) => currencyIds.includes(id));
        }

        uiAccountRequest({
          accounts$,
          currencies: currencyList,
          onSuccess: (account: AccountLike, parentAccount: Account | undefined) => {
            tracking.requestAccountSuccess(manifest);
            resolve(accountToWalletAPIAccount(account, parentAccount));
          },
          onCancel: () => {
            tracking.requestAccountFail(manifest);
            reject(new Error("Canceled by user"));
          },
        });
      });
    });
  }, [manifest, server, tracking, uiAccountRequest]);

  useEffect(() => {
    if (!uiAccountReceive) return;

    server.setHandler("account.receive", ({ account, tokenCurrency }) =>
      receiveOnAccountLogic(
        { manifest, accounts, tracking },
        account.id,
        (account, parentAccount, accountAddress) =>
          new Promise((resolve, reject) =>
            uiAccountReceive({
              account,
              parentAccount,
              accountAddress,
              onSuccess: accountAddress => {
                tracking.receiveSuccess(manifest);
                resolve(accountAddress);
              },
              onCancel: () => {
                tracking.receiveFail(manifest);
                reject(new Error("User cancelled"));
              },
              onError: error => {
                tracking.receiveFail(manifest);
                reject(error);
              },
            }),
          ),
        tokenCurrency,
      ),
    );
  }, [accounts, manifest, server, tracking, uiAccountReceive]);

  useEffect(() => {
    if (!uiMessageSign) return;

    server.setHandler("message.sign", ({ account, message }) =>
      signMessageLogic(
        { manifest, accounts, tracking },
        account.id,
        message.toString("hex"),
        (account: AccountLike, message: AnyMessage) =>
          new Promise((resolve, reject) => {
            return uiMessageSign({
              account,
              message,
              onSuccess: signature => {
                tracking.signMessageSuccess(manifest);
                resolve(Buffer.from(signature.replace("0x", ""), "hex"));
              },
              onCancel: () => {
                tracking.signMessageFail(manifest);
                reject(new UserRefusedOnDevice());
              },
              onError: error => {
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
            new Promise((resolve, reject) =>
              uiTxSign({
                account,
                parentAccount,
                signFlowInfos,
                options,
                onSuccess: signedOperation => {
                  tracking.signTransactionSuccess(manifest);
                  resolve(signedOperation);
                },
                onError: error => {
                  tracking.signTransactionFail(manifest);
                  reject(error);
                },
              }),
            ),
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
            new Promise((resolve, reject) =>
              uiTxSign({
                account,
                parentAccount,
                signFlowInfos,
                options,
                onSuccess: signedOperation => {
                  tracking.signTransactionSuccess(manifest);
                  resolve(signedOperation);
                },
                onError: error => {
                  tracking.signTransactionFail(manifest);
                  reject(error);
                },
              }),
            ),
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

          return uiDeviceTransport({
            appName,
            onSuccess: ({ device: deviceParam, appAndVersion }) => {
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

          return uiDeviceSelect({
            appName,
            onSuccess: ({ device: deviceParam, appAndVersion }) => {
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
    server.setHandler("bitcoin.getXPub", ({ accountId }) => {
      return bitcoinFamillyAccountGetXPubLogic({ manifest, accounts, tracking }, accountId);
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
          new Promise((resolve, reject) =>
            uiExchangeStart({
              exchangeType,
              onSuccess: (nonce: string) => {
                tracking.startExchangeSuccess(manifest);
                resolve(nonce);
              },
              onCancel: error => {
                tracking.completeExchangeFail(manifest);
                reject(error);
              },
            }),
          ),
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
          new Promise((resolve, reject) =>
            uiExchangeComplete({
              exchangeParams: request,
              onSuccess: (hash: string) => {
                tracking.completeExchangeSuccess(manifest);
                resolve(hash);
              },
              onCancel: error => {
                tracking.completeExchangeFail(manifest);
                reject(error);
              },
            }),
          ),
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

export function useCategories(manifests): Categories {
  const [selected, setSelected] = useState(DISCOVER_INITIAL_CATEGORY);

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

type MessageId = number | string | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface JsonRpcRequestMessage<TParams = any> {
  jsonrpc: "2.0";
  // Optional in the request.
  id?: MessageId;
  method: string;
  params?: TParams;
}

const rejectedError = (message: string) => ({
  code: 3,
  message,
  data: [
    {
      code: 104,
      message: "Rejected",
    },
  ],
});

// TODO remove any usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertEthToLiveTX(ethTX: any): WalletAPITransaction {
  return {
    family: "ethereum",
    amount:
      ethTX.value !== undefined
        ? new BigNumber(ethTX.value.replace("0x", ""), 16)
        : new BigNumber(0),
    recipient: safeEncodeEIP55(ethTX.to),
    gasPrice:
      ethTX.gasPrice !== undefined
        ? new BigNumber(ethTX.gasPrice.replace("0x", ""), 16)
        : undefined,
    gasLimit: ethTX.gas !== undefined ? new BigNumber(ethTX.gas.replace("0x", ""), 16) : undefined,
    data: ethTX.data ? Buffer.from(ethTX.data.replace("0x", ""), "hex") : undefined,
  };
}

// Copied from https://www.npmjs.com/package/ethereumjs-util
const isHexPrefixed = (str: string): boolean => {
  if (typeof str !== "string") {
    throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`);
  }

  return str[0] === "0" && str[1] === "x";
};

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const stripHexPrefix = (str: string): string => {
  if (typeof str !== "string")
    throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);

  return isHexPrefixed(str) ? str.slice(2) : str;
};

export function EVMAddressChanged(addr1: string, addr2: string): boolean {
  return addr1.toLowerCase() !== addr2.toLowerCase();
}

export const currentAccountAtom = atom<AccountLike | null>(null);

const currentAccountHistAtom = atomWithStorage<Record<string, string>>(
  "wallet-api-dapp-currentAccountHist",
  {},
);

export function useDappCurrentAccount() {
  const [currentAccount, setCurrentAccount] = useAtom(currentAccountAtom);
  const [currentAccountHist, _setCurrentAccountHist] = useAtom(currentAccountHistAtom);

  // prefer using this setter when the user manually sets a current account
  const setCurrentAccountHist = (manifestId: string, account: AccountLike) => {
    _setCurrentAccountHist({
      ...currentAccountHist,
      [manifestId]: account.id,
    });
  };
  return { currentAccount, setCurrentAccount, setCurrentAccountHist };
}

function useDappAccountLogic({
  manifest,
  accounts,
}: {
  manifest: AppManifest;
  accounts: AccountLike[];
}) {
  const { currencyIds } = usePermission(manifest);
  const { currentAccount, setCurrentAccount } = useDappCurrentAccount();
  const currentAccountHist = useAtomValue(currentAccountHistAtom);
  const currentParentAccount = useMemo(() => {
    if (currentAccount) {
      return getParentAccount(currentAccount, accounts);
    }
  }, [currentAccount, accounts]);

  const firstAccountAvailable = useMemo(() => {
    const account = accounts.find(account => {
      if (account.type === "Account" && currencyIds.includes(account.currency.id)) {
        return account;
      }
    });
    // might not even need to set parent here
    if (account) {
      return getParentAccount(account, accounts);
    }
  }, [accounts, currencyIds]);

  const storedCurrentAccountIsPermitted = useCallback(() => {
    if (!currentAccount) return false;
    return accounts.some(
      account =>
        account.type === "Account" &&
        currencyIds.includes(account.currency.id) &&
        account.id === currentAccount.id,
    );
  }, [currentAccount, accounts, currencyIds]);

  const currentAccountIdFromHist = useMemo(() => {
    return manifest ? currentAccountHist[manifest.id] : null;
  }, [manifest, currentAccountHist]);

  useEffect(() => {
    if (manifest) {
      if (currentAccountIdFromHist) {
        const currentAccountFromHist = accounts.find(
          account => account.id === currentAccountIdFromHist,
        );
        // should never be null
        setCurrentAccount(currentAccountFromHist ? currentAccountFromHist : null);
      } else if (!currentAccount || !(currentAccount && storedCurrentAccountIsPermitted())) {
        // if there is no current account
        // OR if there is a current account but it is not permitted
        // set it to the first permitted account
        setCurrentAccount(firstAccountAvailable ? firstAccountAvailable : null);
      }
    }
  }, [
    accounts,
    firstAccountAvailable,
    currentAccountIdFromHist,
    manifest,
    setCurrentAccount,
    storedCurrentAccountIsPermitted,
    currentAccount,
  ]);

  return {
    currentAccount,
    setCurrentAccount,
    currentParentAccount,
  };
}

// Type guard function to make typescript happy
function isParentAccountPresent(
  account: AccountLike,
  parentAccount?: Account,
): parentAccount is Account {
  if (account.type === "TokenAccount") {
    return !!parentAccount;
  }

  return true;
}

export function useDappLogic({
  manifest,
  accounts,
  postMessage,
  uiHook,
  tracking,
}: {
  manifest: AppManifest;
  postMessage: (message: string) => void;
  accounts: AccountLike[];
  uiHook: UiHook;
  tracking: TrackingAPI;
}) {
  const nanoApp = manifest.dapp?.nanoApp;
  const previousAddressRef = useRef<string>();
  const previousChainIdRef = useRef<number>();
  const { currentAccount, currentParentAccount } = useDappAccountLogic({ manifest, accounts });
  const currentNetwork = useMemo(() => {
    if (!currentAccount) {
      return undefined;
    }
    return manifest.dapp?.networks.find(network => {
      return (
        network.currency ===
        (currentAccount.type === "TokenAccount"
          ? currentAccount.token.id
          : currentAccount.currency.id)
      );
    });
  }, [currentAccount, manifest.dapp?.networks]);

  useEffect(() => {
    if (!currentAccount || !isParentAccountPresent(currentAccount, currentParentAccount)) {
      return;
    }

    const address =
      currentAccount.type === "Account"
        ? currentAccount.freshAddress
        : currentParentAccount.freshAddress;

    if (previousAddressRef.current && EVMAddressChanged(previousAddressRef.current, address)) {
      postMessage(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "accountsChanged",
          params: [[address]],
        }),
      );
    }

    previousAddressRef.current = address;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useEffect(() => {
    if (!currentNetwork) {
      return;
    }

    if (previousChainIdRef.current && previousChainIdRef.current !== currentNetwork.chainID) {
      postMessage(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "chainChanged",
          params: [`0x${currentNetwork.chainID.toString(16)}`],
        }),
      );
    }
    previousChainIdRef.current = currentNetwork.chainID;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNetwork]);

  const onDappMessage = useCallback(
    async (data: JsonRpcRequestMessage) => {
      if (data.jsonrpc !== "2.0") {
        console.error("Request is not a jsonrpc 2.0: ", data);
        return;
      }

      if (!currentNetwork) {
        console.error("No network selected: ", data);
        postMessage(
          JSON.stringify({
            id: data.id,
            jsonrpc: "2.0",
            error: rejectedError("No network selected"),
          }),
        );
        return;
      }

      if (!currentAccount) {
        console.error("No account selected: ", data);
        postMessage(
          JSON.stringify({
            id: data.id,
            jsonrpc: "2.0",
            error: rejectedError("No account selected"),
          }),
        );
        return;
      }

      if (!isParentAccountPresent(currentAccount, currentParentAccount)) {
        console.error("No parent account found for the currentAccount: ", currentAccount, data);
        postMessage(
          JSON.stringify({
            id: data.id,
            jsonrpc: "2.0",
            error: rejectedError("No parent account found"),
          }),
        );
        return;
      }

      switch (data.method) {
        // https://eips.ethereum.org/EIPS/eip-695
        case "eth_chainId": {
          postMessage(
            JSON.stringify({
              id: data.id,
              jsonrpc: "2.0",
              result: `0x${currentNetwork.chainID.toString(16)}`,
            }),
          );
          break;
        }
        // https://eips.ethereum.org/EIPS/eip-1102
        // https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
        case "eth_requestAccounts":
        // legacy method, cf. https://docs.metamask.io/guide/ethereum-provider.html#legacy-methods
        // eslint-disbale-next-line eslintno-fallthrough
        case "enable":
        // https://eips.ethereum.org/EIPS/eip-1474#eth_accounts
        // https://eth.wiki/json-rpc/API#eth_accounts
        // eslint-disbale-next-line eslintno-fallthrough
        case "eth_accounts": {
          const address =
            currentAccount.type === "Account"
              ? currentAccount.freshAddress
              : currentParentAccount.freshAddress;

          postMessage(
            JSON.stringify({
              id: data.id,
              jsonrpc: "2.0",
              result: [address],
            }),
          );
          break;
        }

        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3326.md
        case "wallet_switchEthereumChain": {
          const { chainId } = data.params[0];

          // Check chanId is valid hex string
          const decimalChainId = parseInt(chainId, 16);

          if (isNaN(decimalChainId)) {
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Invalid chainId"),
              }),
            );
            break;
          }

          // Check chain ID is known to the wallet
          const requestedCurrency = manifest.dapp?.networks.find(
            network => network.chainID === decimalChainId,
          );

          if (!requestedCurrency) {
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError(`Chain ID ${chainId} is not supported`),
              }),
            );
            break;
          }

          try {
            await new Promise<void>((resolve, reject) =>
              uiHook["account.request"]({
                currencies: [getCryptoCurrencyById(requestedCurrency.currency)],
                onSuccess: () => {
                  resolve();
                },
                onCancel: () => {
                  reject("User canceled");
                },
              }),
            );
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: null,
              }),
            );
          } catch (error) {
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError(`error switching chain: ${error}`),
              }),
            );
          }
          break;
        }

        // https://eth.wiki/json-rpc/API#eth_sendtransaction
        case "eth_sendTransaction": {
          const ethTX = data.params[0];
          const tx = convertEthToLiveTX(ethTX);
          const address =
            currentAccount.type === "Account"
              ? currentAccount.freshAddress
              : currentParentAccount.freshAddress;

          if (address.toLowerCase() === ethTX.from.toLowerCase()) {
            try {
              const options = nanoApp ? { hwAppId: nanoApp } : undefined;
              tracking.dappSendTransactionRequested(manifest);

              const signFlowInfos = getWalletAPITransactionSignFlowInfos({
                walletApiTransaction: tx,
                account: currentAccount,
              });

              const signedTransaction = await new Promise<SignedOperation>((resolve, reject) =>
                uiHook["transaction.sign"]({
                  account: currentAccount,
                  parentAccount: undefined,
                  signFlowInfos,
                  options,
                  onSuccess: signedOperation => {
                    resolve(signedOperation);
                  },
                  onError: error => {
                    reject(error);
                  },
                }),
              );

              const bridge = getAccountBridge(currentAccount, undefined);
              const mainAccount = getMainAccount(currentAccount, undefined);

              let optimisticOperation: Operation = signedTransaction.operation;

              if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
                optimisticOperation = await bridge.broadcast({
                  account: mainAccount,
                  signedOperation: signedTransaction,
                });
              }

              uiHook["transaction.broadcast"](
                currentAccount,
                undefined,
                mainAccount,
                optimisticOperation,
              );

              tracking.dappSendTransactionSuccess(manifest);

              postMessage(
                JSON.stringify({
                  id: data.id,
                  jsonrpc: "2.0",
                  result: optimisticOperation.hash,
                }),
              );
            } catch (error) {
              tracking.dappSendTransactionFail(manifest);
              postMessage(
                JSON.stringify({
                  id: data.id,
                  jsonrpc: "2.0",
                  error: rejectedError("Transaction declined"),
                }),
              );
            }
          }
          break;
        }
        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md
        // https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
        // https://docs.walletconnect.com/json-rpc-api-methods/ethereum
        // Discussion about the diff between eth_sign and personal_sign:
        // https://github.com/WalletConnect/walletconnect-docs/issues/32#issuecomment-644697172
        case "personal_sign": {
          try {
            /**
             * The message is received as a prefixed hex string.
             * We need to strip the "0x" prefix.
             */
            const message = stripHexPrefix(data.params[0]);
            tracking.dappPersonalSignRequested(manifest);

            const formattedMessage = prepareMessageToSign(
              currentAccount.type === "Account" ? currentAccount : currentParentAccount,
              message,
            );

            const signedMessage = await new Promise<string>((resolve, reject) =>
              uiHook["message.sign"]({
                account: currentAccount,
                message: formattedMessage,
                onSuccess: resolve,
                onError: reject,
                onCancel: () => {
                  reject("Canceled by user");
                },
              }),
            );

            tracking.dappPersonalSignSuccess(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: signedMessage,
              }),
            );
          } catch (error) {
            tracking.dappPersonalSignFail(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Personal message signed declined"),
              }),
            );
          }
          break;
        }

        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        case data.method.match(/eth_signTypedData(_v.)?$/)?.input: {
          try {
            const message = data.params[1];

            tracking.dappSignTypedDataRequested(manifest);

            const formattedMessage = prepareMessageToSign(
              currentAccount.type === "Account" ? currentAccount : currentParentAccount,
              Buffer.from(message).toString("hex"),
            );

            const signedMessage = await new Promise<string>((resolve, reject) =>
              uiHook["message.sign"]({
                account: currentAccount,
                message: formattedMessage,
                onSuccess: resolve,
                onError: reject,
                onCancel: () => {
                  reject("Canceled by user");
                },
              }),
            );

            tracking.dappSignTypedDataSuccess(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: signedMessage,
              }),
            );
          } catch (error) {
            tracking.dappSignTypedDataFail(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Typed Data message signed declined"),
              }),
            );
          }
          break;
        }

        default: {
          // TODO websocket support
          // if (connector.current) {
          //   connector.current.send(data);
          // } else
          if (currentNetwork.nodeURL?.startsWith("https:")) {
            void network({
              method: "POST",
              url: currentNetwork.nodeURL,
              data,
            }).then(res => {
              postMessage(JSON.stringify(res.data));
            });
          }
          break;
        }
      }
    },
    [
      currentAccount,
      currentNetwork,
      currentParentAccount,
      manifest,
      nanoApp,
      postMessage,
      tracking,
      uiHook,
    ],
  );

  return { onDappMessage };
}
