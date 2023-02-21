import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import semver from "semver";
import {
  Account,
  AccountLike,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  WalletHandlers,
  useWalletAPIServer as useWalletAPIServerRaw,
  ServerConfig,
} from "@ledgerhq/wallet-api-server";
import {
  ServerError,
  createCurrencyNotFound,
  Transport,
  Permission,
} from "@ledgerhq/wallet-api-core";
import { Subject } from "rxjs";
import { Observable, firstValueFrom } from "rxjs7";
import { first } from "rxjs/operators";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
  getAccountIdFromWalletAccountId,
} from "./converters";
import { isWalletAPISupportedCurrency } from "./helpers";
import { WalletAPICurrency, AppManifest, WalletAPIAccount } from "./types";
import { getMainAccount, getParentAccount } from "../account";
import {
  listCurrencies,
  findCryptoCurrencyById,
  listSupportedCurrencies,
} from "../currencies";
import { TrackingAPI } from "./tracking";
import {
  bitcoinFamillyAccountGetXPubLogic,
  broadcastTransactionLogic,
  receiveOnAccountLogic,
  signMessageLogic,
  signTransactionLogic,
} from "./logic";
import { getAccountBridge } from "../bridge";
import { getEnv } from "../env";
import openTransportAsSubject, {
  BidirectionalEvent,
} from "../hw/openTransportAsSubject";
import { AppResult } from "../hw/actions/app";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { MessageData } from "../hw/signMessage/types";
import { TypedMessageData } from "../families/ethereum/types";
import { Transaction } from "../generated/types";

/**
 * TODO: we might want to use "searchParams.append" instead of "searchParams.set"
 * to handle duplicated query params (example: "?foo=bar&foo=baz")
 *
 * We can also use the stringify method of qs (https://github.com/ljharb/qs#stringifying)
 */
export function useWalletAPIUrl(
  manifest: AppManifest,
  params: { background?: string; text?: string; loadDate?: Date },
  inputs?: Record<string, string>
): URL {
  return useMemo(() => {
    const url = new URL(manifest.url.toString());

    if (inputs) {
      for (const key in inputs) {
        if (
          Object.prototype.hasOwnProperty.call(inputs, key) &&
          inputs[key] !== undefined
        ) {
          url.searchParams.set(key, inputs[key]);
        }
      }
    }

    if (params.background)
      url.searchParams.set("backgroundColor", params.background);
    if (params.text) url.searchParams.set("textColor", params.text);
    if (params.loadDate) {
      url.searchParams.set("loadDate", params.loadDate.valueOf().toString());
    }

    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }

    return url;
  }, [
    manifest.url,
    manifest.params,
    inputs,
    params.background,
    params.text,
    params.loadDate,
  ]);
}

export function useWalletAPIAccounts(
  accounts: AccountLike[]
): WalletAPIAccount[] {
  return useMemo(() => {
    return accounts.map((account) => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToWalletAPIAccount(account, parentAccount);
    });
  }, [accounts]);
}

export function useWalletAPICurrencies(): WalletAPICurrency[] {
  return useMemo(() => {
    return listCurrencies(true).reduce<WalletAPICurrency[]>(
      (filtered, currency) => {
        if (isWalletAPISupportedCurrency(currency)) {
          filtered.push(currencyToWalletAPICurrency(currency));
        }
        return filtered;
      },
      []
    );
  }, []);
}

export function useGetAccountIds(
  accounts$: Observable<WalletAPIAccount[]> | undefined
): Map<string, boolean> | undefined {
  const [accounts, setAccounts] = useState<WalletAPIAccount[]>([]);

  useEffect(() => {
    if (!accounts$) {
      return undefined;
    }

    const subscription = accounts$.subscribe((walletAccounts) => {
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
    accounts$: Observable<WalletAPIAccount[]>;
    currencies: CryptoCurrency[];
    onSuccess: (
      account: AccountLike,
      parentAccount: Account | undefined
    ) => void;
    onError: () => void;
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
    message: MessageData | TypedMessageData;
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
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
    optimisticOperation: Operation
  ) => void;
  "device.transport": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
}

function usePermission(manifest: AppManifest): Permission {
  return useMemo(
    () => ({
      currencyIds: manifest.currencies === "*" ? ["**"] : manifest.currencies,
      methodIds: manifest.permissions as unknown as string[], // TODO remove when using the correct manifest type
    }),
    [manifest]
  );
}

function useTransport(
  postMessage: (message: string) => void | undefined
): Transport {
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
}: ServerConfig): ServerConfig {
  return useMemo(
    () => ({
      appId,
      userId,
      tracking,
      wallet,
    }),
    [appId, tracking, userId, wallet]
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

        subject$
          .pipe(
            first((e) => e.type === "device-response" || e.type === "error")
          )
          .subscribe({
            next: (e) => {
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
            error: (error) => {
              tracking.deviceExchangeFail(manifest);
              reject(error);
            },
          });

        subject$.next({ type: "input-frame", apduHex });
      });
    },
    [manifest, tracking]
  );

  useEffect(() => {
    return () => {
      ref.current?.complete();
    };
  }, []);

  return useMemo(
    () => ({ ref, subscribe, close, exchange }),
    [close, exchange, subscribe]
  );
}

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
    "transaction.sign": uiTxSign,
    "transaction.broadcast": uiTxBroadcast,
    "device.transport": uiDeviceTransport,
  },
}: {
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
  config: ServerConfig;
  webviewHook: {
    reload: () => void;
    postMessage: (message: string) => void;
  };
  uiHook: Partial<UiHook>;
}): {
  onMessage: (event: string) => void;
  widgetLoaded: boolean;
  onLoad: () => void;
  onReload: () => void;
  onLoadError: () => void;
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
        const cryptoCurrencyIds = currencies.map(({ id }) => id);

        let currencyList: CryptoCurrency[] = [];
        // if single currency available redirect to select account directly
        if (cryptoCurrencyIds.length === 1) {
          const currency = findCryptoCurrencyById(cryptoCurrencyIds[0]);
          if (currency) {
            currencyList = [currency];
          }

          if (!currencyList[0]) {
            tracking.requestAccountFail(manifest);
            // @TODO replace with correct error
            reject(
              new ServerError(createCurrencyNotFound(cryptoCurrencyIds[0]))
            );
          }
        } else {
          currencyList = listSupportedCurrencies().filter(({ id }) =>
            cryptoCurrencyIds.includes(id)
          );
        }

        uiAccountRequest({
          accounts$,
          currencies: currencyList,
          onSuccess: (
            account: AccountLike,
            parentAccount: Account | undefined
          ) => {
            tracking.requestAccountSuccess(manifest);
            resolve(accountToWalletAPIAccount(account, parentAccount));
          },
          onError: () => {
            tracking.requestAccountFail(manifest);
            reject(new Error("Canceled by user"));
          },
        });
      });
    });
  }, [manifest, server, tracking, uiAccountRequest]);

  useEffect(() => {
    if (!uiAccountReceive) return;

    server.setHandler("account.receive", ({ account }) =>
      receiveOnAccountLogic(
        { manifest, accounts, tracking },
        account.id,
        (account, parentAccount, accountAddress) =>
          new Promise((resolve, reject) =>
            uiAccountReceive({
              account,
              parentAccount,
              accountAddress,
              onSuccess: (accountAddress) => {
                tracking.receiveSuccess(manifest);
                resolve(accountAddress);
              },
              onCancel: () => {
                tracking.receiveFail(manifest);
                reject(new Error("User cancelled"));
              },
              onError: (error) => {
                tracking.receiveFail(manifest);
                reject(error);
              },
            })
          )
      )
    );
  }, [accounts, manifest, server, tracking, uiAccountReceive]);

  useEffect(() => {
    if (!uiMessageSign) return;

    server.setHandler("message.sign", ({ account, message }) =>
      signMessageLogic(
        { manifest, accounts, tracking },
        account.id,
        message.toString("hex"),
        (account: AccountLike, message: MessageData | TypedMessageData) =>
          new Promise((resolve, reject) => {
            return uiMessageSign({
              account,
              message,
              onSuccess: (signature) => {
                tracking.signMessageSuccess(manifest);
                resolve(Buffer.from(signature));
              },
              onCancel: () => {
                tracking.signMessageFail(manifest);
                reject(UserRefusedOnDevice());
              },
              onError: (error) => {
                tracking.signMessageFail(manifest);
                reject(error);
              },
            });
          })
      )
    );
  }, [accounts, manifest, server, tracking, uiMessageSign]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler(
      "transaction.sign",
      async ({ account, transaction, options }) => {
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
                onSuccess: (signedOperation) => {
                  tracking.signTransactionSuccess(manifest);
                  resolve(signedOperation);
                },
                onError: (error) => {
                  tracking.signTransactionFail(manifest);
                  reject(error);
                },
              })
            )
        );

        return Buffer.from(signedOperation.signature);
      }
    );
  }, [accounts, manifest, server, tracking, uiTxSign]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler(
      "transaction.signAndBroadcast",
      async ({ account, transaction, options }) => {
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
                onSuccess: (signedOperation) => {
                  tracking.signTransactionSuccess(manifest);
                  resolve(signedOperation);
                },
                onError: (error) => {
                  tracking.signTransactionFail(manifest);
                  reject(error);
                },
              })
            )
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
              uiTxBroadcast(
                account,
                parentAccount,
                mainAccount,
                optimisticOperation
              );

            return optimisticOperation.hash;
          }
        );
      }
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
              device?.subscribe(deviceParam.deviceId);
              resolve("1");
            },
            onCancel: () => {
              tracking.deviceTransportFail(manifest);
              reject(new Error("User cancelled"));
            },
            onError: (error: Error) => {
              tracking.deviceTransportFail(manifest);
              reject(error);
            },
          });
        })
    );
  }, [device, manifest, server, tracking, uiDeviceTransport]);

  useEffect(() => {
    server.setHandler("device.exchange", (params) => {
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
      return bitcoinFamillyAccountGetXPubLogic(
        { manifest, accounts, tracking },
        accountId
      );
    });
  }, [accounts, manifest, server, tracking]);

  return {
    widgetLoaded,
    onMessage,
    onLoad,
    onReload,
    onLoadError,
  };
}
