import {
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WebviewAPI, WebviewState, WebviewTag } from "./types";
import { track } from "~/renderer/analytics/segment";
import { WalletAPIServer } from "@ledgerhq/live-common/wallet-api/types";

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

type UseWebviewStateReturn = {
  webviewState: WebviewState;
  webviewProps: {
    src: string;
  };
  webviewRef: RefObject<WebviewTag>;
  handleRefresh: () => void;
};

export function useWebviewState(
  params: UseWebviewStateParams,
  webviewAPIRef: React.ForwardedRef<WebviewAPI>,
  serverRef?: React.MutableRefObject<WalletAPIServer | undefined>,
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

  const handleFailLoad = useCallback(
    (errorEvent: {
      errorCode: number;
      errorDescription: string;
      validatedURL: string;
      isMainFrame: boolean;
    }) => {
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
    },
    [],
  ) as unknown as EventListenerOrEventListenerObject;

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
    webview.addEventListener("crashed", handleCrashed);

    return () => {
      webview.removeEventListener("page-title-updated", handlePageTitleUpdated);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
      webview.removeEventListener("did-start-loading", handleDidStartLoading);
      webview.removeEventListener("did-stop-loading", handleDidStopLoading);
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-fail-load", handleFailLoad);
      webview.removeEventListener("crashed", handleCrashed);
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

  return {
    webviewState: state,
    webviewProps: props,
    webviewRef,
    handleRefresh,
  };
}
