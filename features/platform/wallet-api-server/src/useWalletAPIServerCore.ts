import { useCallback, useEffect, useMemo } from "react";
import type { RpcRequest, Transport } from "@ledgerhq/wallet-api-core";
import {
  WalletAPIServer,
  type CustomHandlers,
  type ServerConfig,
  type WalletHandlers,
} from "@ledgerhq/wallet-api-server";
import type { WalletAPIAccountsProvider } from "@features/platform-wallet-api-accounts";
import {
  accountFilterOf,
  effectiveCurrencyIds,
  type ManifestCurrencies,
} from "./manifestCurrencies";
import { protectStorageLogic } from "./protectStorage";
import { createHandlerRoutes, ensureRoute, type WalletHandlerName } from "./routeHandlers";

/** The transport of one live app origin: requests are held until `activate`, and dropped on close. */
export interface WalletAPIServerSession extends Transport {
  activate(): void;
  cancelOnClose<T>(promise: Promise<T> | T): Promise<T>;
}

/** What the server reads of a live app manifest. */
export type WalletAPIServerManifest = {
  id: string;
  permissions: string[];
  currencies: ManifestCurrencies;
  storage?: string[];
};

export type WalletAPIServerCoreOptions = {
  session: WalletAPIServerSession;
  manifest: WalletAPIServerManifest;
  config: ServerConfig;
  customHandlers?: CustomHandlers;
  storage?: Partial<Pick<WalletHandlers, "storage.get" | "storage.set">>;
  /** Serves `account.list` before the host's handler. */
  accountsProvider?: WalletAPIAccountsProvider;
  /** Handlers served from the account data, tried before the host's; see `NotServedByAccountDataError`. */
  accountDataHandlers?: Partial<WalletHandlers>;
};

/** Registers a legacy handler, answered only when the account data does not serve the request. */
export type SetLegacyHandler = <K extends WalletHandlerName>(
  method: K,
  handler: WalletHandlers[K],
) => void;

export type WalletAPIServerCore = { server: WalletAPIServer; setHandler: SetLegacyHandler };

/** A server whose requests are dropped once its session is closed. */
function createSessionServer(
  session: WalletAPIServerSession,
  config: ServerConfig,
  customHandlers: CustomHandlers,
): WalletAPIServer {
  // Declared on use: a module that only needs the session helpers loads without the server.
  class SessionWalletAPIServer extends WalletAPIServer {
    protected onRequest(request: RpcRequest): Promise<unknown> {
      return session.cancelOnClose(super.onRequest(request));
    }
  }
  return new SessionWalletAPIServer(session, config, undefined, customHandlers);
}

/** One Wallet API server per session, with the handlers that need no legacy `Account`. */
export function useWalletAPIServerCore({
  session,
  manifest,
  config,
  customHandlers,
  storage,
  accountsProvider,
  accountDataHandlers,
}: WalletAPIServerCoreOptions): WalletAPIServerCore {
  // A new server and routes per session; the effects below keep its config and custom handlers current.
  const { server, routes } = useMemo(
    () => ({
      server: createSessionServer(session, config, customHandlers ?? {}),
      routes: createHandlerRoutes(),
    }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [session],
  );

  const setHandler = useCallback<SetLegacyHandler>(
    (method, handler) => {
      routes.legacy[method] = handler;
      ensureRoute(server, routes, method);
    },
    [routes, server],
  );

  const own = useMemo<Partial<WalletHandlers>>(
    () => ({
      ...accountDataHandlers,
      ...(accountsProvider && {
        "account.list": ({ currencyIds }) =>
          accountsProvider.list(
            accountFilterOf(effectiveCurrencyIds(manifest.currencies, currencyIds)),
          ),
      }),
    }),
    [accountDataHandlers, accountsProvider, manifest.currencies],
  );

  useEffect(() => {
    routes.own = own;
    for (const method of Object.keys(own) as WalletHandlerName[])
      ensureRoute(server, routes, method);
  }, [own, routes, server]);

  useEffect(() => {
    if (customHandlers) server.setCustomHandlers(customHandlers);
  }, [customHandlers, server]);

  useEffect(() => {
    server.setConfig(config);
  }, [config, server]);

  useEffect(() => {
    server.setPermissions({ methodIds: manifest.permissions });
  }, [manifest.permissions, server]);

  const { id: manifestId, storage: manifestStorage } = manifest;
  const storageGet = storage?.["storage.get"];
  useEffect(() => {
    if (!storageGet) return;
    const rule = { id: manifestId, storage: manifestStorage };
    server.setHandler("storage.get", protectStorageLogic(rule, storageGet));
  }, [manifestId, manifestStorage, server, storageGet]);

  const storageSet = storage?.["storage.set"];
  useEffect(() => {
    if (!storageSet) return;
    const rule = { id: manifestId, storage: manifestStorage };
    server.setHandler("storage.set", protectStorageLogic(rule, storageSet));
  }, [manifestId, manifestStorage, server, storageSet]);

  // Requests flow once every effect of this commit has run, the host's handlers included.
  useEffect(() => {
    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent) session.activate();
    });
    return () => {
      isCurrent = false;
    };
  }, [session, server]);

  return useMemo(() => ({ server, setHandler }), [server, setHandler]);
}

/** Registers each of `handlers` as a legacy handler. */
export function setHandlers(setHandler: SetLegacyHandler, handlers: Partial<WalletHandlers>): void {
  for (const method of Object.keys(handlers) as WalletHandlerName[]) {
    const handler = handlers[method];
    if (handler) setHandler(method, handler as WalletHandlers[typeof method]);
  }
}
