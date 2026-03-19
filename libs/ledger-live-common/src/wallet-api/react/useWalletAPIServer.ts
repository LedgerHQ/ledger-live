import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import type { WalletHandlers, ServerConfig } from "@ledgerhq/wallet-api-server";
import type { Transport } from "@ledgerhq/wallet-api-core";
import { first } from "rxjs/operators";
import { Subject } from "rxjs";
import { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { useFeatureFlags } from "../../featureFlags/FeatureFlagsContext";
import { handlers as featureFlagsHandlers } from "../FeatureFlags";
import openTransportAsSubject, { BidirectionalEvent } from "../../hw/openTransportAsSubject";
import { useCurrenciesUnderFeatureFlag } from "../../modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import type { HandlerDeps, DeviceTransport, useWalletAPIServerOptions } from "./types";
import { usePermission } from "./usePermission";
import { useSetWalletAPIAccounts } from "./useSetWalletAPIAccounts";

import { createCurrencyListHandler } from "./handlers/currencyList";
import { createAccountListHandler } from "./handlers/accountList";
import { createAccountRequestHandler } from "./handlers/accountRequest";
import { createAccountReceiveHandler } from "./handlers/accountReceive";
import { createMessageSignHandler } from "./handlers/messageSign";
import { createStorageGetHandler, createStorageSetHandler } from "./handlers/storage";
import { createBitcoinSignPsbtHandler } from "./handlers/bitcoinSignPsbt";
import { createTransactionSignHandler } from "./handlers/transactionSign";
import { createTransactionSignRawHandler } from "./handlers/transactionSignRaw";
import { createTransactionSignAndBroadcastHandler } from "./handlers/transactionSignAndBroadcast";
import {
  createDeviceTransportHandler,
  createDeviceSelectHandler,
  createDeviceOpenHandler,
  createDeviceExchangeHandler,
  createDeviceCloseHandler,
} from "./handlers/device";
import {
  createBitcoinGetAddressHandler,
  createBitcoinGetAddressesHandler,
  createBitcoinGetPublicKeyHandler,
  createBitcoinGetXPubHandler,
} from "./handlers/bitcoin";
import { createExchangeStartHandler, createExchangeCompleteHandler } from "./handlers/exchange";

function useTransport(postMessage: (message: string) => void | undefined): Transport {
  return useMemo(() => {
    return {
      onMessage: undefined,
      send: postMessage,
    };
  }, [postMessage]);
}

function useDeviceTransport(
  handlerDepsRef: React.RefObject<HandlerDeps | null>,
): DeviceTransport {
  const transportRef = useRef<Subject<BidirectionalEvent> | undefined>(undefined);

  const subscribe = useCallback((deviceId: string) => {
    transportRef.current = openTransportAsSubject({ deviceId });

    transportRef.current.subscribe({
      complete: () => {
        transportRef.current = undefined;
      },
    });
  }, []);

  const close = useCallback(() => {
    transportRef.current?.complete();
  }, []);

  const exchange = useCallback<WalletHandlers["device.exchange"]>(
    ({ apduHex }) => {
      const subject$ = transportRef.current;
      const { manifest, tracking } = handlerDepsRef.current!;

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
    [handlerDepsRef],
  );

  useEffect(() => {
    return () => {
      transportRef.current?.complete();
    };
  }, []);

  return useMemo(
    () => ({ ref: transportRef, subscribe, close, exchange }),
    [close, exchange, subscribe],
  );
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const { getFeature } = useFeatureFlags();
  const permission = usePermission(manifest);
  const transport = useTransport(webviewHook.postMessage);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useSetWalletAPIAccounts(accounts);

  const mergedCustomHandlers = useMemo(() => {
    const featureFlagsHandlersInstance = featureFlagsHandlers({ manifest, getFeature });

    return {
      ...featureFlagsHandlersInstance,
      ...customHandlers,
    };
  }, [manifest, customHandlers, getFeature]);

  const serverRef = useRef<WalletAPIServer | undefined>(undefined);
  if (serverRef.current === undefined) {
    serverRef.current = new WalletAPIServer(transport, config, undefined, mergedCustomHandlers);
  }
  const server = serverRef.current;

  // --- Ref-based handler deps ---
  const handlerDepsRef = useRef<HandlerDeps | null>(null);
  const device = useDeviceTransport(handlerDepsRef);

  // Sync ref on every render so handlers always read latest values
  handlerDepsRef.current = {
    walletState,
    manifest,
    accounts,
    tracking,
    config,
    dispatch,
    deactivatedCurrencyIds,
    webviewReload: webviewHook.reload,
    uiAccountRequest,
    uiAccountReceive,
    uiMessageSign,
    uiStorageGet,
    uiStorageSet,
    uiTxSign,
    uiTxSignRaw,
    uiTxBroadcast,
    uiDeviceTransport,
    uiDeviceSelect,
    uiExchangeStart,
    uiExchangeComplete,
    device,
  };

  // --- Server config / permission syncing (true side effects) ---
  useEffect(() => {
    if (mergedCustomHandlers) {
      server.setCustomHandlers(mergedCustomHandlers);
    }
  }, [mergedCustomHandlers, server]);

  useEffect(() => {
    server.setConfig(config);
  }, [config, server]);

  useEffect(() => {
    server.setPermissions(permission);
  }, [permission, server]);

  useEffect(() => {
    tracking.load(manifest);
  }, [tracking, manifest]);

  // --- Register all handlers once ---
  useEffect(() => {
    const getDeps = () => handlerDepsRef.current!;

    server.setHandler("currency.list", createCurrencyListHandler(getDeps));
    server.setHandler("account.list", createAccountListHandler(getDeps));
    server.setHandler("account.request", createAccountRequestHandler(getDeps));
    server.setHandler("account.receive", createAccountReceiveHandler(getDeps));
    server.setHandler("message.sign", createMessageSignHandler(getDeps));
    server.setHandler("storage.get", createStorageGetHandler(getDeps));
    server.setHandler("storage.set", createStorageSetHandler(getDeps));
    server.setHandler("bitcoin.signPsbt", createBitcoinSignPsbtHandler(getDeps));
    server.setHandler("transaction.sign", createTransactionSignHandler(getDeps));
    server.setHandler("transaction.signRaw", createTransactionSignRawHandler(getDeps));
    server.setHandler("transaction.signAndBroadcast", createTransactionSignAndBroadcastHandler(getDeps));
    server.setHandler("device.transport", createDeviceTransportHandler(getDeps));
    server.setHandler("device.select", createDeviceSelectHandler(getDeps));
    server.setHandler("device.open", createDeviceOpenHandler(getDeps));
    server.setHandler("device.exchange", createDeviceExchangeHandler(getDeps));
    server.setHandler("device.close", createDeviceCloseHandler(getDeps));
    server.setHandler("bitcoin.getAddress", createBitcoinGetAddressHandler(getDeps));
    server.setHandler("bitcoin.getAddresses", createBitcoinGetAddressesHandler(getDeps));
    server.setHandler("bitcoin.getPublicKey", createBitcoinGetPublicKeyHandler(getDeps));
    server.setHandler("bitcoin.getXPub", createBitcoinGetXPubHandler(getDeps));
    server.setHandler("exchange.start", createExchangeStartHandler(getDeps));
    server.setHandler("exchange.complete", createExchangeCompleteHandler(getDeps));
  }, [server]);

  // --- Callbacks (read from ref for stability) ---
  const onMessage = useCallback(
    (event: string) => {
      transport.onMessage?.(event);
    },
    [transport],
  );

  const onLoad = useCallback(() => {
    const { tracking: t, manifest: m } = handlerDepsRef.current!;
    t.loadSuccess(m);
    setWidgetLoaded(true);
  }, []);

  const onReload = useCallback(() => {
    const { tracking: t, manifest: m, webviewReload } = handlerDepsRef.current!;
    t.reload(m);
    setWidgetLoaded(false);
    webviewReload();
  }, []);

  const onLoadError = useCallback(() => {
    const { tracking: t, manifest: m } = handlerDepsRef.current!;
    t.loadFail(m);
  }, []);

  return {
    widgetLoaded,
    onMessage,
    onLoad,
    onReload,
    onLoadError,
    server,
  };
}
