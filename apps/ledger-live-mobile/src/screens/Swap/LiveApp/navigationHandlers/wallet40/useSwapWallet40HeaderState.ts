import { RefObject, useCallback, useEffect, useSyncExternalStore } from "react";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { parseSwapWallet40Route } from "./parseSwapWallet40Route";
import { SwapWallet40HeaderState } from "./types";

type SwapWallet40HeaderStoreState = SwapWallet40HeaderState & {
  goBackWebview: (() => void) | null;
};

/**
 * Module-level store shared between Swap webview route updates and navigator UI
 * consumers (header/tab bar). We explicitly reset to default when:
 * - Swap screen unmounts (via updater hook cleanup)
 * - the last subscriber unsubscribes (safety net for stale state)
 * - callers invoke resetSwapWallet40HeaderState()
 */
const DEFAULT_STATE: SwapWallet40HeaderStoreState = {
  routeName: "home",
  headerStyle: "transparent",
  titleKey: null,
  canGoBack: false,
  isTransactionComplete: false,
  goBackWebview: null,
};

let currentState: SwapWallet40HeaderStoreState = DEFAULT_STATE;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(listener => listener());
}

function setState(nextState: SwapWallet40HeaderStoreState) {
  currentState = nextState;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      currentState = DEFAULT_STATE;
    }
  };
}

function getSnapshot() {
  return currentState;
}

export function useSwapWallet40HeaderState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function resetSwapWallet40HeaderState() {
  setState(DEFAULT_STATE);
}

export function useSwapWallet40HeaderStateUpdater(webviewRef: RefObject<WebviewAPI | null>) {
  const updateHeaderState = useCallback(
    (webviewState: WebviewState) => {
      const parsedRoute = parseSwapWallet40Route(webviewState.url);

      setState({
        routeName: parsedRoute.routeName,
        headerStyle: parsedRoute.headerStyle,
        titleKey: parsedRoute.titleKey,
        canGoBack: webviewState.canGoBack,
        isTransactionComplete: parsedRoute.isTransactionComplete,
        goBackWebview: () => webviewRef.current?.goBack(),
      });
    },
    [webviewRef],
  );

  useEffect(() => {
    return () => {
      setState(DEFAULT_STATE);
    };
  }, []);

  return updateHeaderState;
}
