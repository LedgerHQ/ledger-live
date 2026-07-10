import { useMemo, useEffect, useRef, useCallback } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { AppManifest, DiscoverDB } from "../types";
import { TrackingAPI } from "../tracking";
import { UiHook } from "../handlers/types";
import { SetCurrentAccountHistDb } from "./types";
import { SmartWebsocket } from "../SmartWebsocket";
import { onDappMessage } from "../handlers/dapp/onDappMessage";
import { JsonRpcRequestMessage } from "../handlers/dapp/types";
import { useDappAccountLogic } from "./useDappAccountLogic";

export function useDappLogic({
  manifest,
  accounts,
  postMessage,
  uiHook,
  tracking,
  currentAccountHistDb,
  setCurrentAccountHistDb,
  initialAccountId,
  referrer,
  mevProtected,
}: {
  manifest: AppManifest;
  postMessage: (message: string) => void;
  accounts: AccountLike[];
  uiHook: UiHook;
  tracking: TrackingAPI;
  currentAccountHistDb?: DiscoverDB["currentAccountHist"];
  setCurrentAccountHistDb?: SetCurrentAccountHistDb;
  initialAccountId?: string;
  referrer?: string;
  mevProtected?: boolean;
}) {
  const ws = useRef<SmartWebsocket | undefined>(undefined);
  const {
    currentAccount,
    currentAccountFromHist,
    currentParentAccount,
    setCurrentAccount,
    setCurrentAccountHist,
  } = useDappAccountLogic({
    manifest,
    accounts,
    currentAccountHistDb,
    setCurrentAccountHistDb,
    initialAccountId,
  });

  /** Current network is needed for recognising the current chain id.
   * If a token account is selected, this depends on the parent currency. */
  const currentNetwork = useMemo(() => {
    if (!currentAccount) {
      return undefined;
    }
    // If the current account is a token account, and the chain id is not specified for that specific token, we can also use the network of the parent currency to determine the correct chain id.
    return manifest.dapp?.networks.find(n => {
      const accountCurrencyId =
        currentAccount.type === "TokenAccount"
          ? currentAccount.token.id
          : currentAccount.currency.id;
      const accountNetworkCurrency =
        currentAccount.type === "TokenAccount"
          ? currentAccount.token.parentCurrencyId
          : currentAccount.currency.id;

      return n.currency === accountCurrencyId || n.currency === accountNetworkCurrency;
    });
  }, [currentAccount, manifest.dapp?.networks]);

  const currentAddress = useMemo(() => {
    return currentAccount?.type === "Account"
      ? currentAccount.freshAddress
      : currentParentAccount?.freshAddress;
  }, [currentAccount, currentParentAccount?.freshAddress]);

  useEffect(() => {
    if (!currentAddress) {
      return;
    }

    postMessage(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "accountsChanged",
        params: [[currentAddress]],
      }),
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAddress]);

  useEffect(() => {
    if (!currentNetwork) {
      return;
    }

    postMessage(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "chainChanged",
        params: [`0x${currentNetwork.chainID.toString(16)}`],
      }),
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNetwork?.chainID]);

  useEffect(() => {
    if (currentNetwork?.nodeURL) {
      const rpcURL = new URL(currentNetwork.nodeURL);
      if (rpcURL.protocol === "wss:") {
        const websocket = new SmartWebsocket(rpcURL.toString(), {
          reconnect: true,
          reconnectMaxAttempts: Infinity,
        });

        websocket.on("message", message => {
          postMessage(JSON.stringify(message));
        });

        websocket.connect();

        ws.current = websocket;
        return () => {
          websocket.close();
          ws.current = undefined;
        };
      }
    }
  }, [currentNetwork?.nodeURL, postMessage]);

  const onDappMessageCallback = useCallback(
    (data: JsonRpcRequestMessage) =>
      onDappMessage(
        {
          manifest,
          currentAccount,
          currentParentAccount,
          currentNetwork,
          postMessage,
          tracking,
          uiHook,
          setCurrentAccount,
          setCurrentAccountHist,
          mevProtected,
          referrer,
          wsRef: ws,
        },
        data,
      ),
    [
      currentAccount,
      currentNetwork,
      currentParentAccount,
      manifest,
      mevProtected,
      postMessage,
      referrer,
      setCurrentAccount,
      setCurrentAccountHist,
      tracking,
      uiHook,
    ],
  );

  const isLoadingAccounts = !currentAccount && !!currentAccountFromHist;

  return { onDappMessage: onDappMessageCallback, noAccounts: !currentAccount, isLoadingAccounts };
}
