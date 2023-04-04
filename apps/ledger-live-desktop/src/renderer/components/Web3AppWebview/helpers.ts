import {
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { addParamsToURL } from "@ledgerhq/live-common/wallet-api/helpers";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { LiveAppManifest } from "~/../../../libs/ledger-live-common/lib/platform/types";
import { WebviewAPI, WebviewState, WebviewTag } from "./types";

export const initialWebviewState: WebviewState = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
};

type UseWebviewStateParams = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
};

type UseWebviewStateReturn = {
  webviewState: WebviewState;
  webviewProps: {
    src: string;
  };
  webviewRef: RefObject<WebviewTag>;
};

export function useWebviewState(
  params: UseWebviewStateParams,
  webviewAPIRef: React.ForwardedRef<WebviewAPI>,
): UseWebviewStateReturn {
  const webviewRef = useRef<WebviewTag>(null);
  const { manifest, inputs } = params;

  const initialURL = useMemo(() => {
    const url = new URL(manifest.url);
    addParamsToURL(url, inputs);
    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }
    return url.toString();
  }, [manifest, inputs]);

  const [state, setState] = useState<WebviewState>(initialWebviewState);

  /*
  TODO: find a way to send custom headers
  const { theme } = useTheme();

  const headers = useMemo(() => {
    return getClientHeaders({
      client: "ledger-live-desktop",
      theme,
    });
  }, [theme]);
  */

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
      };
    },
    [webviewRef],
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

    setState({
      url: webview.getURL(),
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      title: webview.getTitle(),
      loading: webview.isLoading(),
    });
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

    return () => {
      webview.removeEventListener("page-title-updated", handlePageTitleUpdated);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
      webview.removeEventListener("did-start-loading", handleDidStartLoading);
      webview.removeEventListener("did-stop-loading", handleDidStopLoading);
      webview.removeEventListener("dom-ready", handleDomReady);
    };
  }, [
    handleDidNavigate,
    handleDidNavigateInPage,
    handleDidStartLoading,
    handleDidStopLoading,
    handlePageTitleUpdated,
    handleDomReady,
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
  };
}
