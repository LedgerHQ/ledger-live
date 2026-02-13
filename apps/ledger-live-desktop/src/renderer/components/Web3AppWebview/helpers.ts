import {
  type RefObject,
  type ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import {
  CurrentAccountHistDB,
  safeGetRefValue,
  useDAppManifestCurrencyIds,
} from "@ledgerhq/live-common/wallet-api/react";
import { WalletAPIServer } from "@ledgerhq/live-common/wallet-api/types";
import { track } from "~/renderer/analytics/segment";
import { setDrawer } from "~/renderer/drawers/Provider";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { WebviewAPI, WebviewState, WebviewTag } from "./types";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { ModularDrawerLocation, useModularDrawerVisibility } from "LLD/features/ModularDrawer";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { AccountLike } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDrawer";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";

export const initialWebviewState: WebviewState = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
  isAppUnavailable: false,
};

type UseWebviewStateParams = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | boolean | undefined>;
};

type WebviewPartition = {
  partition?: string;
};

type UseWebviewStateReturn = {
  webviewState: WebviewState;
  webviewProps: {
    src: string;
  };
  webviewRef: RefObject<WebviewTag | null>;
  webviewPartition: WebviewPartition;
  handleRefresh: () => void;
};

export function useWebviewState(
  params: UseWebviewStateParams,
  webviewAPIRef: ForwardedRef<WebviewAPI>,
  serverRef?: RefObject<WalletAPIServer | undefined>,
): UseWebviewStateReturn {
  const webviewRef = useRef<WebviewTag>(null);
  const { manifest, inputs } = params;
  const initialURL = useMemo(() => getInitialURL(inputs, manifest), [manifest, inputs]);
  const [state, setState] = useState<WebviewState>(initialWebviewState);

  useImperativeHandle(
    webviewAPIRef,
    () => {
      return {
        reload: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.reload();
        },
        goBack: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.goBack();
        },
        goForward: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.goForward();
        },
        openDevTools: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.openDevTools();
        },
        loadURL: (url: string): Promise<void> => {
          const webview = safeGetRefValue(webviewRef);

          return webview.loadURL(url);
        },
        clearHistory: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.clearHistory();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notify: (method: `event.${string}`, params: any) => {
          serverRef?.current?.sendMessage(method, params);
        },
      };
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [isMounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, [isMounted]);

  const handlePageTitleUpdated = useCallback((event: Electron.PageTitleUpdatedEvent) => {
    setState(oldState => ({
      ...oldState,
      title: event.title,
    }));
  }, []);

  const handleDidNavigateInPage = useCallback(
    (event: Electron.DidNavigateInPageEvent) => {
      const webview = webviewRef.current;

      if (!webview || !event.isMainFrame) {
        return;
      }

      setState(oldState => ({
        ...oldState,
        url: event.url,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
      }));
    },
    [webviewRef],
  );

  const handleDidNavigate = useCallback(
    (event: Electron.DidNavigateEvent) => {
      const webview = webviewRef.current;

      if (!webview) {
        return;
      }

      setState(oldState => ({
        ...oldState,
        url: event.url,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
      }));
    },
    [webviewRef],
  );

  const handleDidStartLoading = useCallback(() => {
    setState(oldState => ({
      ...oldState,
      loading: true,
      isAppUnavailable: false,
    }));
  }, []);

  const handleDidStopLoading = useCallback(() => {
    setState(oldState => ({
      ...oldState,
      loading: false,
    }));
  }, []);

  const handleDomReady = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    setState(oldState => ({
      url: webview.getURL(),
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      title: webview.getTitle(),
      loading: webview.isLoading(),
      isAppUnavailable: oldState.isAppUnavailable,
    }));
  }, [webviewRef]);

  const handleFailLoad = useCallback((errorEvent: Electron.DidFailLoadEvent) => {
    const { errorCode, validatedURL, isMainFrame } = errorEvent;
    const fullURL = new URL(validatedURL);
    const errorInfo = {
      errorCode,
      url: fullURL.hostname,
    };
    console.error("Web3AppView handleFailLoad", { errorInfo, isMainFrame });
    track("useWebviewState", errorInfo);

    if (isMainFrame) {
      setState(oldState => ({
        ...oldState,
        loading: false,
        isAppUnavailable: true,
      }));
    }
  }, []);

  const handleCrashed = useCallback(() => {
    setState(oldState => ({
      ...oldState,
      loading: false,
      isAppUnavailable: true,
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    const webview = safeGetRefValue(webviewRef);
    webview.reload();
  }, [webviewRef]);

  useEffect(() => {
    const webview = webviewRef.current;

    if (!isMounted || !webview) {
      return;
    }

    webview.addEventListener("page-title-updated", handlePageTitleUpdated);
    webview.addEventListener("did-navigate", handleDidNavigate);
    webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
    webview.addEventListener("did-start-loading", handleDidStartLoading);
    webview.addEventListener("did-stop-loading", handleDidStopLoading);
    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-fail-load", handleFailLoad);
    webview.addEventListener("render-process-gone", handleCrashed);

    return () => {
      webview.removeEventListener("page-title-updated", handlePageTitleUpdated);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
      webview.removeEventListener("did-start-loading", handleDidStartLoading);
      webview.removeEventListener("did-stop-loading", handleDidStopLoading);
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-fail-load", handleFailLoad);
      webview.removeEventListener("render-process-gone", handleCrashed);
    };
  }, [
    handleDidNavigate,
    handleDidNavigateInPage,
    handleDidStartLoading,
    handleDidStopLoading,
    handlePageTitleUpdated,
    handleDomReady,
    handleFailLoad,
    handleCrashed,
    webviewRef,
    isMounted,
  ]);

  const props = {
    src: initialURL,
  };

  const webviewPartition = useMemo(() => {
    const _webviewPartition: WebviewPartition = {};
    if (manifest.cacheBustingId !== undefined) {
      // webview data will persist across LL app reloads
      // when changing cacheBustingId, the partition will change and the webview's cache will be reset
      // NOTE: setting partition to "temp-no-cache" (anything that's not starting with "persist")
      // means that the webview will not persist data across LL app reloads
      const idSlug = manifest.id.replace(/[^a-zA-Z0-9]/g, "");
      _webviewPartition.partition = `persist:${idSlug}-${manifest.cacheBustingId}`;
    }
    return _webviewPartition;
  }, [manifest]);

  return {
    webviewState: state,
    webviewProps: props,
    webviewRef,
    webviewPartition,
    handleRefresh,
  };
}

export function useSelectAccount({
  manifest,
  currentAccountHistDb,
}: {
  manifest: LiveAppManifest;
  currentAccountHistDb?: CurrentAccountHistDB;
}) {
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "lldModularDrawer",
  });

  const modularDrawerVisible = isModularDrawerVisible({
    location: ModularDrawerLocation.LIVE_APP,
    liveAppId: manifest.id,
  });

  const currencyIds = useDAppManifestCurrencyIds(manifest);
  const { setCurrentAccountHist, setCurrentAccount, currentAccount } = useDappCurrentAccount(
    manifest.id,
    currentAccountHistDb,
  );

  const onSuccess = useCallback(
    (account: AccountLike) => {
      setDrawer();
      setCurrentAccountHist(manifest.id, account);
      setCurrentAccount(account);
    },
    [manifest.id, setCurrentAccountHist, setCurrentAccount],
  );

  const onCancel = useCallback(() => {
    setDrawer();
  }, []);

  const source =
    currentRouteNameRef.current === "Platform Catalog"
      ? "Discover"
      : currentRouteNameRef.current ?? "Unknown";

  const flow = manifest.name;

  const dispatch = useDispatch();

  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const onSelectAccount = useCallback(() => {
    if (modularDrawerVisible) {
      dispatch(setFlowValue(flow));
      dispatch(setSourceValue(source));

      openAssetAndAccount({
        currencies: currencyIds,
        onSuccess,
        onCancel,
        areCurrenciesFiltered: true,
      });
    } else {
      setDrawer(
        SelectAccountAndCurrencyDrawer,
        {
          flow,
          source,
          currencyIds,
          onAccountSelected: onSuccess,
        },
        {
          onRequestClose: onCancel,
        },
      );
    }
  }, [
    modularDrawerVisible,
    dispatch,
    flow,
    source,
    openAssetAndAccount,
    currencyIds,
    onSuccess,
    onCancel,
  ]);

  return { onSelectAccount, currentAccount };
}
