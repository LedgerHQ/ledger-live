import { useEffect, useMemo } from "react";
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
  /** Serves `account.list`; without it, the host registers its own handler. */
  accountsProvider?: WalletAPIAccountsProvider;
};

class SessionWalletAPIServer extends WalletAPIServer {
  constructor(
    private readonly session: WalletAPIServerSession,
    config: ServerConfig,
    customHandlers: CustomHandlers,
  ) {
    super(session, config, undefined, customHandlers);
  }

  protected onRequest(request: RpcRequest): Promise<unknown> {
    return this.session.cancelOnClose(super.onRequest(request));
  }
}

/** One Wallet API server per session, with the handlers that need no legacy `Account`. */
export function useWalletAPIServerCore({
  session,
  manifest,
  config,
  customHandlers,
  storage,
  accountsProvider,
}: WalletAPIServerCoreOptions): WalletAPIServer {
  // A new server per session; the effects below keep its config and custom handlers current.
  const server = useMemo<WalletAPIServer>(
    () => new SessionWalletAPIServer(session, config, customHandlers ?? {}),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [session],
  );

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

  useEffect(() => {
    if (!accountsProvider) return;
    server.setHandler("account.list", ({ currencyIds }) =>
      accountsProvider.list(
        accountFilterOf(effectiveCurrencyIds(manifest.currencies, currencyIds)),
      ),
    );
  }, [accountsProvider, manifest.currencies, server]);

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

  return server;
}
